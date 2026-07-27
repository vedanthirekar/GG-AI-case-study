// ============================================================================
// The credential boundary for the one real model call in this product.
//
// `src/lib/gemini.js` used to call Google directly with a VITE_-prefixed key,
// which Vite inlines into the client bundle - readable by anyone who opens
// DevTools. That was an acceptable trade on localhost and is not acceptable on
// a public URL, so the call moved here. The key is now a server-side
// environment variable that never crosses the network to the browser.
//
// Runs on Vercel's Edge runtime because the response is a stream: the SSE body
// from Google is piped straight through, so the assistant still types out token
// by token rather than waiting for a complete answer.
//
// Scope of what this protects: the key. The endpoint itself is unauthenticated,
// so it is still someone else's quota to burn if they find it - the caps below
// bound the damage per request. Real protection is a signed session, which this
// prototype deliberately doesn't have.
// ============================================================================

export const config = { runtime: 'edge' }

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'

// VITE_-prefixed names are accepted as a fallback so an existing .env.local
// keeps working locally. Only the unprefixed names should be set in production -
// anything VITE_ is, by definition, public.
const apiKey = () => process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
// Pinned rather than `gemini-flash-latest`: the alias moves, and when it moved
// to a Gemini 3 model it started rejecting `thinkingBudget` with a 400.
const modelId = () => process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash'

// Bounds on a public endpoint. The brief is large but finite; a conversation
// that exceeds these is not a help question.
const MAX_SYSTEM_CHARS = 32000
const MAX_TURNS = 24
const MAX_TURN_CHARS = 4000

const json = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
})

// Same mapping the client used to do against Google's status codes, kept here so
// the browser still receives a typed failure it can phrase for the user.
const kindFor = (status) =>
  status === 429 ? 'rate-limited'
    : status === 404 ? 'model'
      : status === 401 || status === 403 ? 'auth'
        : status === 400 ? 'model' // usually a generationConfig the model rejects
          : 'network'

export default async function handler(req) {
  // A capability probe. The browser can no longer inspect the key, so it asks
  // whether the assistant is live and which model is answering.
  if (req.method === 'GET') return json(200, { live: Boolean(apiKey()), model: modelId() })
  if (req.method !== 'POST') return json(405, { kind: 'network', message: 'Method not allowed.' })

  const key = apiKey()
  if (!key) return json(503, { kind: 'no-key', message: 'No API key is configured on the server.' })

  let body
  try { body = await req.json() } catch { return json(400, { kind: 'network', message: 'Malformed request body.' }) }

  const { system, history } = body || {}
  if (typeof system !== 'string' || !Array.isArray(history)) {
    return json(400, { kind: 'network', message: 'Expected { system, history }.' })
  }
  if (system.length > MAX_SYSTEM_CHARS || history.length > MAX_TURNS) {
    return json(413, { kind: 'network', message: 'That conversation is too long to send.' })
  }

  const contents = history.map((m) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: String(m.text ?? '').slice(0, MAX_TURN_CHARS) }],
  }))

  let upstream
  try {
    upstream = await fetch(`${ENDPOINT}/${modelId()}:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        // Generation settings live server-side now, where a caller can't raise
        // the token ceiling or turn the temperature up on someone else's quota.
        generationConfig: {
          temperature: 0.3,   // help answers should be repeatable, not creative
          maxOutputTokens: 900,
          // The model reasons before answering by default. For a help chat that
          // buys nothing and costs several seconds before the first token.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    })
  } catch {
    return json(502, { kind: 'network', message: 'Could not reach the model.' })
  }

  if (!upstream.ok || !upstream.body) {
    return json(upstream.status || 502, { kind: kindFor(upstream.status), message: 'The model rejected that request.' })
  }

  // Straight passthrough - the client already knows how to parse `alt=sse`.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  })
}
