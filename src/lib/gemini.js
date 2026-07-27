// ============================================================================
// A minimal Gemini client - the one place in this prototype that talks to a
// real model. Everything else labelled "AI" (src/data/ai.js) is a stub with a
// stable contract; this is not.
//
// Deliberately dependency-free: `fetch` plus a small SSE parser, in keeping
// with the rest of the project. The official SDK would add ~200kB to a bundle
// that needs one endpoint.
//
// The key comes from VITE_GEMINI_API_KEY in .env.local. Vite inlines that at
// build time, so it IS readable in the shipped bundle - an accepted trade-off
// for a prototype with no backend, documented in the README. When the key is
// absent this module reports `no-key` and the caller falls back to the
// deterministic help-centre answerer, so the feature degrades instead of
// breaking.
// ============================================================================

const KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
// Pinned, not `gemini-flash-latest`: the alias moves, and when it moved to a
// Gemini 3 model it started rejecting `thinkingBudget` with a 400. A named
// version is the one that keeps working. Note that appearing in ListModels is
// not the same as being callable - 2.5-flash is still listed but 404s for keys
// issued after its deprecation.
const MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS = 30000

export const hasApiKey = () => Boolean(KEY)
export const modelName = () => MODEL

// Typed failures, so the UI can say something specific rather than shrugging.
export class GeminiError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind // 'no-key' | 'rate-limited' | 'auth' | 'model' | 'blocked' | 'network' | 'aborted'
  }
}

const MESSAGES = {
  'no-key': 'No API key is configured, so I answered from the help centre instead.',
  'rate-limited': 'The free-tier rate limit is exhausted for the moment. Here’s the help-centre answer instead.',
  auth: 'That API key was rejected. Here’s the help-centre answer instead.',
  model: `The model “${MODEL}” isn’t available on this key. Set VITE_GEMINI_MODEL to one that is. Here’s the help-centre answer instead.`,
  blocked: 'I couldn’t answer that one. Try rephrasing, or ask your preparer in Messages.',
  network: 'I couldn’t reach the model. Here’s the help-centre answer instead.',
}
export const explainError = (kind) => MESSAGES[kind] || MESSAGES.network

/**
 * Stream an answer, yielding text deltas as they arrive.
 *
 * @param {object}   opts
 * @param {string}   opts.system     system instruction (brief + live context)
 * @param {Array}    opts.history    [{ role: 'user'|'model', text }]
 * @param {AbortSignal} opts.signal
 * @param {(delta: string) => void} opts.onDelta
 * @returns {Promise<string>} the full text
 */
export async function streamAnswer({ system, history, signal, onDelta }) {
  if (!KEY) throw new GeminiError('no-key', MESSAGES['no-key'])

  // Our own deadline on top of the caller's abort: a stream that stalls
  // mid-response would otherwise leave the composer disabled forever.
  const timer = new AbortController()
  const deadline = setTimeout(() => timer.abort(), TIMEOUT_MS)
  const onOuterAbort = () => timer.abort()
  signal?.addEventListener('abort', onOuterAbort)

  let res
  try {
    res = await fetch(`${ENDPOINT}/${MODEL}:streamGenerateContent?alt=sse&key=${encodeURIComponent(KEY)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: timer.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
        generationConfig: {
          temperature: 0.3,          // help answers should be repeatable, not creative
          maxOutputTokens: 900,
          // 2.5-flash reasons before answering by default. For a help chat that
          // buys nothing and costs several seconds before the first token.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch (e) {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', onOuterAbort)
    if (signal?.aborted) throw new GeminiError('aborted', 'Stopped.')
    throw new GeminiError('network', MESSAGES.network)
  }

  try {
    if (!res.ok) {
      const kind = res.status === 429 ? 'rate-limited'
        : res.status === 404 ? 'model'
        : res.status === 401 || res.status === 403 ? 'auth'
        : res.status === 400 ? 'model' // usually a generationConfig the model rejects
        : 'network'
      throw new GeminiError(kind, MESSAGES[kind])
    }

    let full = ''
    for await (const chunk of sseChunks(res.body)) {
      const cand = chunk?.candidates?.[0]
      const text = (cand?.content?.parts || []).map((p) => p.text || '').join('')
      if (text) { full += text; onDelta?.(text) }
      if (cand?.finishReason && cand.finishReason !== 'STOP' && !full) {
        throw new GeminiError('blocked', MESSAGES.blocked)
      }
    }
    if (!full.trim()) throw new GeminiError('blocked', MESSAGES.blocked)
    return full
  } catch (e) {
    if (e instanceof GeminiError) throw e
    if (signal?.aborted) throw new GeminiError('aborted', 'Stopped.')
    throw new GeminiError('network', MESSAGES.network)
  } finally {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}

// Parse `alt=sse` output: `data: {json}` lines separated by blank lines.
async function* sseChunks(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    // Keep the trailing fragment - an SSE event can split across reads.
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try { yield JSON.parse(payload) } catch { /* partial JSON - skip */ }
    }
  }
}
