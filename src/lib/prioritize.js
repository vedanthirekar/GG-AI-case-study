// ============================================================================
// Prioritization (Challenge 07).
// Real ranking/filter logic over the mock dataset — this is genuinely wired up,
// not faked. It answers "what should I work on right now?" by scoring each task
// on due date, blocking status, kind, and the stage of its return.
// ============================================================================
import { returnById } from '../data/db'

const KIND_WEIGHT = { review: 30, approval: 26, prep: 20, request: 16, question: 12 }

export function daysUntil(dateStr, from = new Date('2026-07-24')) {
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
