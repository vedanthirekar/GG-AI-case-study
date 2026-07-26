// ============================================================================
// Simulated AI (Challenge 10).
// These stubs return plausible, structured "AI output" the same shape a real
// model + tool pipeline might emit. NOTHING here calls a model — the values are
// derived deterministically from the mock field so the UI can render confidence,
// evidence, uncertainty, a recommended action and a correction path.
// The point of the case study is how we PRESENT and build trust around AI, so
// this is deliberately a stub with a stable contract.
// ============================================================================

const band = (c) =>
  c == null ? 'none' : c >= 90 ? 'high' : c >= 75 ? 'medium' : 'low'

// Given a field from db, produce an AI explanation object.
export function explainField(field, sourceDoc) {
  if (!field) return null
  const confidence = field.confidence ?? null
  const evidence = []
  if (sourceDoc) {
    evidence.push({
      kind: 'source',
      label: `${sourceDoc.type} — ${sourceDoc.issuer}`,
      detail: field.sourceLocation || 'matched region',
      docId: sourceDoc.id,
    })
  }
  if (field.transform) evidence.push({ kind: 'transform', label: 'Transformation', detail: field.transform })
  if (field.calc) {
    evidence.push({
      kind: 'calc',
      label: 'Calculation',
      detail: field.calc.map((c) => `${c.label}: ${c.value < 0 ? '−' : ''}$${Math.abs(c.value).toLocaleString()}`).join('  ·  '),
    })
  }
  // uncertainty + recommended action derived from state/confidence
  let uncertainty = null
  let action = { label: 'Accept & verify', tone: 'primary' }
  if (field.flag) uncertainty = field.flag
  if (band(confidence) === 'low' || field.state === 'review') {
    action = { label: 'Review before verifying', tone: 'warn' }
    if (!uncertainty) uncertainty = 'Confidence is below our auto-verify threshold.'
  }
  if (field.state === 'locked') action = { label: 'Locked — edit the inputs', tone: 'muted' }
  if (field.state === 'readonly') action = { label: 'Set by IRS rule', tone: 'muted' }

  return {
    fieldId: field.id,
    summary: aiSummary(field),
    confidence,
    band: band(confidence),
    evidence,
    uncertainty,
    action,
    note: field.aiNote || null,
  }
}

function aiSummary(f) {
  const amt = `$${Number(f.amount).toLocaleString()}`
  if (f.state === 'locked') return `Verity calculated ${amt} from other lines on the return (${f.formula || f.transform}).`
  if (f.state === 'readonly') return `${amt} is set by an IRS rule (${f.transform}).`
  if (f.sourceLocation) return `Verity extracted ${amt} from ${f.sourceLocation}. ${f.transform === 'Copied as-is' ? 'No transformation applied.' : f.transform + '.'}`
  return `${amt} was entered directly; Verity has no source document for it.`
}

// A tiny "did the AI find anything worth flagging" pass, used on the dashboard.
export function returnAiFlags(ret) {
  const flags = []
  for (const f of ret.fields || []) {
    if (f.flag) flags.push({ fieldId: f.id, line: f.line, text: f.flag, confidence: f.confidence })
    else if (f.confidence != null && f.confidence < 75) flags.push({ fieldId: f.id, line: f.line, text: `Low confidence on ${f.label} (${f.confidence}%).`, confidence: f.confidence })
  }
  return flags
}

// Simulate applying a user's correction — returns the "after" object the UI shows.
export function applyCorrection(field, newValue) {
  return {
    ...field,
    amount: newValue,
    state: 'verified',
    confidence: 100,
    correctedFrom: field.amount,
    correctedAt: new Date().toISOString(),
    aiNote: `Overridden by user. Verity will learn from this correction for similar ${field.label.toLowerCase()} fields.`,
  }
}
