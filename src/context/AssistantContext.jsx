// ============================================================================
// Conversation state for "Ask Vantage".
//
// Lives at app level rather than inside the drawer so a conversation survives
// navigating around - which matters, because the assistant's whole point is
// that it can tell you where to go and you can go there without losing the
// thread. It also lets any screen call openAsk() to hand a question over.
//
// In memory only, and cleared on sign-out: the same stance as the rest of the
// prototype, and the right one for something that has read a person's return.
// ============================================================================
import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSession } from './SessionContext'
import { useStore } from './StoreContext'
import { useChrome } from './ChromeContext'
import { streamAnswer, assistantStatus, explainError, GeminiError } from '../lib/gemini'
import { buildSystemBrief, buildLiveContext, parseAnswer, starterPrompts } from '../lib/assistant'
import { fallbackAnswer } from '../lib/assistantFallback'

const AssistantCtx = createContext(null)

// Enough turns for a real back-and-forth without resending an essay every time.
const MAX_TURNS = 8

export function AssistantProvider({ children }) {
  const session = useSession()
  const store = useStore()
  const { crumbs } = useChrome()
  const location = useLocation()

  const [messages, setMessages] = useState([])   // { id, role, text, links, sources, degraded, error }
  const [streaming, setStreaming] = useState(false)
  const [openRequest, setOpenRequest] = useState(null) // { tab, prefill, n } - consumed by AppShell
  const abortRef = useRef(null)
  const seq = useRef(0)

  // Whether a real model is answering, and which one. The key lives on the
  // server now, so this is asked rather than read from the bundle. Optimistic
  // until the probe lands: a slow answer here must not make the UI claim the
  // assistant is offline when it isn't.
  const [status, setStatus] = useState({ live: true, model: '' })
  useEffect(() => {
    let alive = true
    assistantStatus().then((s) => { if (alive) setStatus(s) })
    return () => { alive = false }
  }, [])

  // A conversation is bound to a person. Switching account must not carry one
  // user's return into another user's context window.
  const uid = session.userId
  useEffect(() => {
    setMessages([])
    abortRef.current?.abort()
    setStreaming(false)
  }, [uid])

  useEffect(() => () => abortRef.current?.abort(), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  const reset = useCallback(() => { stop(); setMessages([]) }, [stop])

  // Ask the drawer to open, optionally on a given tab and with a question ready
  // to send. `n` forces a fresh object so repeat calls always register.
  const openAsk = useCallback((prefill = '') => {
    seq.current += 1
    setOpenRequest({ tab: 'ask', prefill, n: seq.current })
  }, [])
  const consumeOpenRequest = useCallback(() => setOpenRequest(null), [])

  const ask = useCallback(async (question) => {
    const q = String(question || '').trim()
    if (!q || streaming) return

    seq.current += 1
    const userMsg = { id: `m-u-${seq.current}`, role: 'user', text: q }
    const replyId = `m-a-${seq.current}`

    // History for the model is the conversation BEFORE this turn, plus it.
    const history = [...messages, userMsg]
      .filter((m) => !m.error)
      .slice(-MAX_TURNS * 2)
      .map((m) => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }))

    setMessages((prev) => [...prev, userMsg,
      { id: replyId, role: 'model', text: '', links: [], sources: [], pending: true }])
    setStreaming(true)

    const patch = (fields) => setMessages((prev) =>
      prev.map((m) => (m.id === replyId ? { ...m, ...fields } : m)))

    // Both failure paths land here: answer from the curated corpus and say so.
    const degrade = (kind) => {
      const fb = fallbackAnswer(q, { isFirm: session.isFirm, path: location.pathname })
      patch({
        pending: false,
        degraded: explainError(kind),
        text: fb?.body || 'I can’t reach the model right now, and I don’t have a curated answer for that one. The help centre may have it.',
        links: fb?.links || [{ to: '/help/faq', label: 'Browse the help centre' }],
        sources: fb?.sources || [],
      })
    }

    // A shortcut, not the guard: the function returns a typed 'no-key' anyway,
    // so correctness doesn't depend on the probe having landed.
    if (!status.live) { degrade('no-key'); setStreaming(false); return }

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const system = `${buildSystemBrief({ isFirm: session.isFirm, caps: session.caps })}

---

## CURRENT CONTEXT - the live state of this person's session. Everything below
## is true right now. Never contradict it, and never state a figure that isn't here.

${buildLiveContext({ session, store, location, crumbs })}`

      let raw = ''
      await streamAnswer({
        system,
        history,
        signal: controller.signal,
        onDelta: (delta) => {
          raw += delta
          // parseAnswer withholds anything past the "---" sentinel, so the
          // machine-readable tail never flashes on screen mid-stream.
          const { body } = parseAnswer(raw, { session })
          patch({ text: body, pending: false })
        },
      })

      const { body, links, sources } = parseAnswer(raw, { session })
      patch({ text: body, links, sources, pending: false })
    } catch (e) {
      const kind = e instanceof GeminiError ? e.kind : 'network'
      if (kind === 'aborted') {
        // Keep whatever streamed in; just mark it as cut short.
        setMessages((prev) => prev.map((m) => m.id === replyId
          ? { ...m, pending: false, degraded: m.text ? 'Stopped.' : null,
              text: m.text || 'Stopped before I got anywhere.' }
          : m))
      } else if (kind === 'blocked') {
        patch({ pending: false, error: true, text: explainError('blocked'), links: [], sources: [] })
      } else {
        degrade(kind)
      }
    } finally {
      abortRef.current = null
      setStreaming(false)
    }
  }, [messages, streaming, status.live, session, store, location, crumbs])

  const suggestions = useMemo(
    () => starterPrompts({ session, location }),
    [session, location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    messages, streaming, ask, stop, reset,
    openAsk, openRequest, consumeOpenRequest,
    suggestions, live: status.live, model: status.model,
  }), [messages, streaming, ask, stop, reset, openAsk, openRequest, consumeOpenRequest, suggestions, status])

  return <AssistantCtx.Provider value={value}>{children}</AssistantCtx.Provider>
}

export function useAssistant() {
  const ctx = useContext(AssistantCtx)
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider')
  return ctx
}
