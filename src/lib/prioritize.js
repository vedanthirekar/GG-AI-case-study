// ============================================================================
// Prioritization (Challenge 07).
// Real ranking/filter logic over the mock dataset - this is genuinely wired up,
// not faked. It answers "what should I work on right now?" by scoring each task
// on due date, blocking status, kind, and the stage of its return.
// ============================================================================
import { returnById } from '../data/db'

const KIND_WEIGHT = { review: 30, approval: 26, prep: 20, request: 16, question: 12 }

// The dataset is seeded around a fixed "today" so due dates stay stable between
// runs. Everything that talks about dates reads it from here, or the dashboard
// would greet you with one date while the rows counted from another.
export const TODAY = new Date('2026-07-24')

export function daysUntil(dateStr, from = TODAY) {
  const d = new Date(dateStr)
  return Math.round((d - from) / 86400000)
}

// Higher score = more urgent.
export function scoreTask(task) {
  const ret = returnById(task.returnId)
  let score = 0
  const dLeft = daysUntil(task.due)
  if (dLeft < 0) score += 60 + Math.min(40, -dLeft * 4) // overdue dominates
  else if (dLeft === 0) score += 55
  else if (dLeft <= 2) score += 40
  else if (dLeft <= 5) score += 25
  else if (dLeft <= 10) score += 12
  if (task.blocked) score += 22
  score += KIND_WEIGHT[task.kind] || 10
  if (ret?.blocked) score += 8
  if (ret && ret.stage === 'review') score += 6
  return Math.round(score)
}

export function urgencyBand(score) {
  if (score >= 75) return { key: 'critical', label: 'Critical', tone: 'danger' }
  if (score >= 55) return { key: 'high', label: 'High', tone: 'warn' }
  if (score >= 35) return { key: 'medium', label: 'Medium', tone: 'accent' }
  return { key: 'low', label: 'Low', tone: 'muted' }
}

export function rankTasks(tasks, { assigneeId, kind, onlyBlocked } = {}) {
  return tasks
    .filter((t) => t.status === 'open')
    .filter((t) => (assigneeId ? t.assigneeId === assigneeId : true))
    .filter((t) => (kind ? t.kind === kind : true))
    .filter((t) => (onlyBlocked ? t.blocked : true))
    .map((t) => ({ ...t, score: scoreTask(t), band: urgencyBand(scoreTask(t)), dLeft: daysUntil(t.due) }))
    .sort((a, b) => b.score - a.score)
}

// Ordering the ranked list a different way, without a second scoring system.
// `rankTasks` has already attached `score`, `band` and `dLeft`, so these are
// pure re-orderings of the same data - which is what keeps the dashboard's
// "why is this first?" answer consistent whichever sort is applied.
const BAND_RANK = { critical: 0, high: 1, medium: 2, low: 3 }

// 'priority' | 'due' | 'severity' - the dashboard's column headers select these.
export function sortTasks(list, mode) {
  const out = [...list]
  if (mode === 'due') {
    // Soonest first; overdue items are negative, so they lead naturally.
    return out.sort((a, b) => a.dLeft - b.dLeft || b.score - a.score)
  }
  if (mode === 'severity') {
    return out.sort((a, b) => BAND_RANK[a.band.key] - BAND_RANK[b.band.key] || b.score - a.score)
  }
  return out // 'priority' - already in score order from rankTasks
}

// Dashboard summary counters over any task list.
export function summarize(tasks) {
  const open = tasks.filter((t) => t.status === 'open')
  const ranked = open.map((t) => ({ ...t, score: scoreTask(t) }))
  return {
    total: open.length,
    overdue: open.filter((t) => daysUntil(t.due) < 0).length,
    dueToday: open.filter((t) => daysUntil(t.due) === 0).length,
    blocked: open.filter((t) => t.blocked).length,
    critical: ranked.filter((t) => t.score >= 75).length,
  }
}
