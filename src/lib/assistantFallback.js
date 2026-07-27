// ============================================================================
// The answer of last resort.
//
// When there's no API key, when the free tier is exhausted, or when the network
// is gone, "Ask Vantage" must not become a dead button. This scores the curated
// help corpus against the question and returns the best entry VERBATIM - so the
// degraded path is still correct, just less conversational.
//
// Nothing here is generated. If nothing scores, it says so rather than guessing.
// ============================================================================
import { FAQ, GUIDES, PAGE_HELP, forAudience } from '../data/help'

// Words that match everything and therefore discriminate nothing.
const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'do', 'does', 'did', 'can', 'could', 'will', 'would', 'should', 'i', 'me', 'my',
  'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'to', 'of', 'in',
  'on', 'for', 'with', 'at', 'by', 'from', 'as', 'if', 'so', 'not', 'no', 'what',
  'how', 'why', 'when', 'where', 'who', 'which', 'am', 'get', 'got', 'about',
  'there', 'here', 'have', 'has', 'had', 'they', 'we', 'us', 'our',
])

const terms = (s) => String(s || '').toLowerCase().match(/[a-z']{2,}/g)?.filter((w) => !STOP.has(w)) || []

// Light stemming so "verifying" finds "verify" and "documents" finds "document".
const stem = (w) => w.replace(/(ing|ed|es|s)$/, '')

function score(query, haystack, weightedHead = '') {
  const q = [...new Set(terms(query).map(stem))]
  if (!q.length) return 0
  const body = terms(haystack).map(stem)
  const head = terms(weightedHead).map(stem)
  let hits = 0
  for (const t of q) {
    if (head.includes(t)) hits += 2.5      // a match in the question itself counts double
    else if (body.includes(t)) hits += 1
  }
  return hits / q.length
}

/**
 * Best curated answer for a question, or null if nothing is a plausible match.
 * @returns {{ body: string, sources: Array, links: Array } | null}
 */
export function fallbackAnswer(question, { isFirm = true, path = '/' } = {}) {
  const candidates = [
    ...forAudience(FAQ, isFirm).map((f) => ({
      id: f.id, head: f.q, text: `${f.q} ${f.a} ${f.cat}`, body: f.a,
      source: { id: f.id, label: f.q, to: '/help/faq' },
    })),
    ...forAudience(GUIDES, isFirm).map((g) => ({
      id: g.id, head: g.title, text: `${g.title} ${g.body}`, body: g.body,
      source: { id: g.id, label: g.title, to: '/help/guides' },
    })),
  ]

  const ranked = candidates
    .map((c) => ({ ...c, s: score(question, c.text, c.head) }))
    .sort((a, b) => b.s - a.s)

  const best = ranked[0]
  if (!best || best.s < 0.34) return screenHelp(path)

  // A close runner-up is worth offering as a second citation rather than
  // pretending the first was a perfect hit.
  const also = ranked[1] && ranked[1].s >= best.s - 0.12 ? ranked[1] : null

  return {
    body: best.body,
    sources: [best.source, also?.source].filter(Boolean),
    links: [{ to: '/help/faq', label: 'Browse the help centre' }],
  }
}

// Nothing matched - fall back to the guidance for the screen they're on, which
// is at least relevant even when it isn't an answer.
function screenHelp(path) {
  const help = PAGE_HELP.find((p) => path.startsWith(p.match))
  if (!help) return null
  return {
    body: `I don’t have a curated answer for that one. For ${help.title.toLowerCase()}: ${help.points.join(' ')}`,
    sources: [],
    links: [{ to: '/help/faq', label: 'Browse the help centre' }],
  }
}
