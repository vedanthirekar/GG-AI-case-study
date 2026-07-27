// ============================================================================
// The client half of the one real model call in this prototype. Everything else
// labelled "AI" (src/data/ai.js) is a stub with a stable contract; this is not.
//
// This no longer talks to Google. It posts to `/api/gemini`, a serverless
// function that holds the key (see api/gemini.js). Nothing secret is inlined
// into the bundle, which is what makes this safe to deploy publicly. What stays
// here is the SSE parsing and the typed errors, so the UI can still say
// something specific rather than shrugging.
//
// Deliberately dependency-free: `fetch` plus a small SSE parser, in keeping
// with the rest of the project.
// ============================================================================

const API = '/api/gemini'
const TIMEOUT_MS = 30000
const DEFAULT_MODEL = 'gemini-3.5-flash'

// Typed failures, so the UI can say something specific rather than shrugging.
export class GeminiError extends Error {
  constructor(kind, message) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind // 'no-key' | 'rate-limited' | 'auth' | 'model' | 'blocked' | 'network' | 'aborted'
  }
}

const MESSAGES = {
  'no-key': 'The assistant isn’t configured on this deployment, so I answered from the help centre instead.',
  'rate-limited': 'The free-tier rate limit is exhausted for the moment. Here’s the help-centre answer instead.',
  auth: 'The server’s API key was rejected. Here’s the help-centre answer instead.',
  model: 'The configured model isn’t available. Here’s the help-centre answer instead.',
  blocked: 'I couldn’t answer that one. Try rephrasing, or ask your preparer in Messages.',
  network: 'I couldn’t reach the model. Here’s the help-centre answer instead.',
}
export const explainError = (kind) => MESSAGES[kind] || MESSAGES.network

/**
 * Ask the server whether the assistant is live, and which model is answering.
 *
 * The browser can no longer see the key, so this is the only way to know. The
 * promise is cached: it's one answer per page load, not per question. A failed
 * probe reports optimistically - the POST itself returns a typed error, so a
 * probe that couldn't complete must not be what silences the assistant.
 *
 * @returns {Promise<{live: boolean, model: string}>}
 */
let probe = null
export function assistantStatus() {
  probe ||= fetch(API, { method: 'GET' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => ({ live: d?.live ?? true, model: d?.model || DEFAULT_MODEL }))
    .catch(() => ({ live: true, model: DEFAULT_MODEL }))
  return probe
}

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
  // Our own deadline on top of the caller's abort: a stream that stalls
  // mid-response would otherwise leave the composer disabled forever.
  const timer = new AbortController()
  const deadline = setTimeout(() => timer.abort(), TIMEOUT_MS)
  const onOuterAbort = () => timer.abort()
  signal?.addEventListener('abort', onOuterAbort)

  let res
  try {
    res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: timer.signal,
      body: JSON.stringify({ system, history }),
    })
  } catch {
    clearTimeout(deadline)
    signal?.removeEventListener('abort', onOuterAbort)
    if (signal?.aborted) throw new GeminiError('aborted', 'Stopped.')
    throw new GeminiError('network', MESSAGES.network)
  }

  try {
    if (!res.ok) {
      // The function classifies the upstream failure for us; fall back to the
      // status only if it returned something unexpected.
      let kind = 'network'
      try { kind = (await res.json())?.kind || 'network' } catch { /* not JSON */ }
      throw new GeminiError(kind, MESSAGES[kind] || MESSAGES.network)
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
