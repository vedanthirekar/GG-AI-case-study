// ============================================================================
// Vantage mock database.
// Everything here is FAKE but internally consistent. A deterministic seeded RNG
// generates volume (dozens of returns, hundreds of documents) so search,
// filtering, prioritization and the affordance system are exercised against
// real scale - and a set of hand-authored "hero" records give the traceability,
// onboarding and collaboration screens genuine depth.
// No network, no persistence: this module is the single source of truth.
// ============================================================================
import {
  STAGES, stageIndex, DOC_TYPES, FIRST, LAST,
  EMPLOYERS, BANKS, BROKERS,
} from './catalog'

// --- deterministic RNG (mulberry32) -----------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260724)
const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1))
const chance = (p) => rnd() < p
const money = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) / 10) * 10

const YEAR = 2025
const today = new Date('2026-07-24')
const daysFromNow = (d) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10)

// ============================================================================
// USERS  (Challenge 05 - six roles, one of them multi-role)
// ============================================================================
// `email` is the sign-in handle (any password is accepted - there is no auth
// backend). `blurb` is the one-line "what you'll see" shown on the login screen.
export const users = [
  { id: 'u-dana', name: 'Dana Morales', initials: 'DM', roles: ['preparer', 'individual'], primary: 'preparer', title: 'Senior Tax Preparer', tint: '#2563eb',
    email: 'dana.morales@vantage.tax', blurb: 'Prepares returns - and files her own. Two roles, one login.' },
  { id: 'u-sam', name: 'Sam Okafor', initials: 'SO', roles: ['reviewer'], primary: 'reviewer', title: 'Review Manager', tint: '#7c3aed',
    email: 'sam.okafor@vantage.tax', blurb: 'Signs returns off for filing; sees every internal note.' },
  { id: 'u-priya', name: 'Priya Nair', initials: 'PN', roles: ['admin'], primary: 'admin', title: 'Firm Administrator', tint: '#0891b2',
    email: 'priya.nair@vantage.tax', blurb: 'Runs the firm and controls who can do what.' },
  { id: 'u-jordan', name: 'Jordan Lee', initials: 'JL', roles: ['seasonal'], primary: 'seasonal', title: 'Seasonal Preparer', tint: '#b45309',
    email: 'jordan.lee@vantage.tax', blurb: 'Busy-season hire - reduced permissions, assigned work only.' },
  { id: 'u-rivera', name: 'Jordan Rivera', initials: 'JR', roles: ['individual'], primary: 'individual', title: 'Client', tint: '#16a34a',
    email: 'j.rivera@gmail.com', blurb: 'Returning taxpayer with a return mid-review.' },
  { id: 'u-alex', name: 'Alex Chen', initials: 'AC', roles: ['individual'], primary: 'individual', title: 'Client (new)', tint: '#db2777',
    email: 'alex.chen@outlook.com', blurb: 'Brand-new client - starts at day one, nothing set up yet.' },
  { id: 'u-maya', name: 'Maya Torres', initials: 'MT', roles: ['business'], primary: 'business', title: 'Owner, Torres Design Co.', tint: '#ca8a04',
    email: 'maya@torresdesign.co', blurb: 'Business owner filing an 1120-S for her studio.' },
]
export const userById = (id) => users.find((u) => u.id === id)
export const userByEmail = (email) => users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase())

// The firm employee who ALSO has a personal return in the system (multi-role demo).
export const MULTI_ROLE_USER = 'u-dana'

const PREPARERS = ['u-dana', 'u-jordan']
const REVIEWERS = ['u-sam']

// ============================================================================
// Helper: build a fake document with highlightable "boxes"
// ============================================================================
let docSeq = 0
function makeDoc(returnId, clientId, spec) {
  docSeq += 1
  const t = spec.typeDef || pick(DOC_TYPES)
  const statusKey = spec.status || (chance(0.15) ? 'needs-review' : chance(0.15) ? 'received' : 'processed')
  return {
    id: spec.id || `d-${docSeq}`,
    returnId, clientId,
    type: t.type,
    category: t.cat,
    name: spec.name || `${t.type} - ${spec.issuer || pick(EMPLOYERS)}`,
    issuer: spec.issuer || '-',
    pages: spec.pages || int(1, 3),
    uploaded: spec.uploaded || daysFromNow(-int(10, 150)),
    status: statusKey,
    source: spec.source || (chance(0.7) ? 'client-upload' : 'imported'),
    boxes: spec.boxes || null,
  }
}

// ============================================================================
// HERO RETURN - Jordan Rivera, Form 1040, 2025
// Fully traceable fields wired to real source documents. Powers Challenge 01,
// 08 and 10 with hand-tuned states, confidences and calculations.
// ============================================================================
const riveraDocs = [
  makeDoc('r-rivera', 'u-rivera', {
    id: 'd-rivera-w2', typeDef: DOC_TYPES[0], issuer: 'Acme Corporation',
    name: 'W-2 - Acme Corporation', pages: 1, uploaded: '2026-02-03', status: 'processed', source: 'client-upload',
    boxes: [
      { key: 'employer', label: 'Employer', value: 'Acme Corporation' },
      { key: 'employee', label: 'Employee', value: 'Rivera, Jordan' },
      { key: 'box1', label: 'Box 1 - Wages, tips, other comp.', value: '92,400.00' },
      { key: 'box2', label: 'Box 2 - Federal income tax withheld', value: '14,880.00' },
      { key: 'box3', label: 'Box 3 - Social security wages', value: '96,000.00' },
      { key: 'box5', label: 'Box 5 - Medicare wages', value: '96,000.00' },
    ],
  }),
  makeDoc('r-rivera', 'u-rivera', {
    id: 'd-rivera-int', typeDef: DOC_TYPES[1], issuer: 'First National',
    name: '1099-INT - First National', pages: 1, uploaded: '2026-02-05', status: 'processed', source: 'imported',
    boxes: [
      { key: 'payer', label: 'Payer', value: 'First National Bank' },
      { key: 'box1', label: 'Box 1 - Interest income', value: '1,204.00' },
    ],
  }),
  makeDoc('r-rivera', 'u-rivera', {
    id: 'd-rivera-div', typeDef: DOC_TYPES[2], issuer: 'Fidelis Brokerage',
    name: '1099-DIV - Fidelis Brokerage', pages: 2, uploaded: '2026-02-11', status: 'needs-review', source: 'imported',
    boxes: [
      { key: 'payer', label: 'Payer', value: 'Fidelis Brokerage' },
      { key: 'box1a', label: 'Box 1a - Total ordinary dividends', value: '4,410.00' },
      { key: 'box1b', label: 'Box 1b - Qualified dividends', value: '3,980.00' },
    ],
  }),
  makeDoc('r-rivera', 'u-rivera', {
    id: 'd-rivera-b', typeDef: DOC_TYPES[4], issuer: 'Bluepeak Securities',
    name: '1099-B - Bluepeak Securities', pages: 4, uploaded: '2026-02-18', status: 'needs-review', source: 'imported',
    boxes: [
      { key: 'payer', label: 'Payer', value: 'Bluepeak Securities' },
      { key: 'proceeds', label: 'Proceeds', value: '48,900.00' },
      { key: 'basis', label: 'Cost basis (reported)', value: '42,790.00' },
      { key: 'gain', label: 'Net gain/loss', value: '6,110.00' },
    ],
  }),
  makeDoc('r-rivera', 'u-rivera', {
    id: 'd-rivera-1098', typeDef: DOC_TYPES[7], issuer: 'Meridian Bank',
    name: '1098 - Meridian Bank (mortgage)', pages: 1, uploaded: '2026-02-06', status: 'processed', source: 'client-upload',
    boxes: [
      { key: 'lender', label: 'Lender', value: 'Meridian Bank' },
      { key: 'box1', label: 'Box 1 - Mortgage interest received', value: '11,240.00' },
    ],
  }),
]

const riveraFields = [
  { id: 'f-1a', line: '1a', group: 'Income', label: 'Wages, salaries, tips', amount: 92400, prior: 88000, state: 'ai', confidence: 96,
    sourceDocId: 'd-rivera-w2', sourceBox: 'box1', sourceLocation: 'Box 1 · page 1', transform: 'Copied as-is',
    aiNote: 'Matches last year’s wages adjusted for a 5% raise; single clean source.' },
  { id: 'f-2b', line: '2b', group: 'Income', label: 'Taxable interest', amount: 1204, prior: 1150, state: 'verified', confidence: 99,
    sourceDocId: 'd-rivera-int', sourceBox: 'box1', sourceLocation: 'Box 1 · page 1', transform: 'Copied as-is',
    verifiedBy: 'u-dana', aiNote: 'Single payer, exact match.' },
  { id: 'f-3a', line: '3a', group: 'Income', label: 'Qualified dividends', amount: 3980, prior: 3600, state: 'review', confidence: 71,
    sourceDocId: 'd-rivera-div', sourceBox: 'box1b', sourceLocation: 'Box 1b · page 1', transform: 'Copied as-is',
    aiNote: 'Box 1a (ordinary) and 1b (qualified) differ by $430 - confirm the qualified portion is what belongs on 3a.',
    flag: 'Ordinary vs. qualified dividends often get swapped. Worth a human check.',
    candidates: [
      { key: 'qualified', value: 3980, label: 'Qualified dividends (Box 1b)', rationale: 'Line 3a is specifically the qualified portion. Box 1b = $3,980.', confidence: 82, recommended: true,
        evidence: ['1099-DIV Box 1b = $3,980', 'Line 3a is defined as qualified dividends only'] },
      { key: 'ordinary', value: 4410, label: 'Total ordinary dividends (Box 1a)', rationale: 'If the whole distribution should be treated as ordinary, use Box 1a = $4,410.', confidence: 44,
        evidence: ['1099-DIV Box 1a = $4,410', 'Would overstate the qualified line by $430'] },
    ] },
  { id: 'f-7', line: '7', group: 'Income', label: 'Capital gain / (loss)', amount: 6110, prior: 2100, state: 'review', confidence: 68,
    sourceDocId: 'd-rivera-b', sourceBox: 'gain', sourceLocation: 'Schedule D · from 1099-B', transform: 'Proceeds − cost basis',
    calc: [
      { label: 'Proceeds (1099-B)', value: 48900 },
      { label: 'Cost basis (reported)', value: -42790 },
    ],
    aiNote: 'Two lots on the 1099-B show “basis not reported to IRS.” Gain may change once basis is confirmed.',
    flag: 'Cost basis on 2 of 11 lots is unverified.',
    anomaly: 'Nearly 3× last year - driven by the two lots with unconfirmed basis.',
    candidates: [
      { key: 'reported', value: 6110, label: 'Basis as reported ($42,790)', rationale: 'Use the cost basis the broker reported on the 9 covered lots and the client’s figure for the other 2.', confidence: 68, recommended: true,
        evidence: ['1099-B proceeds $48,900 − basis $42,790', 'Client provided basis for 2 uncovered lots'] },
      { key: 'zerobasis', value: 8910, label: 'Assume $0 basis on 2 lots', rationale: 'Conservative: treat the 2 unconfirmed lots as $0 basis until a statement arrives.', confidence: 55,
        evidence: ['Adds $2,800 of gain', 'Safe default when basis is missing - revise when the client uploads the statement'] },
    ] },
  { id: 'f-8', line: '8', group: 'Income', label: 'Other income', amount: 0, prior: 0, state: 'editable', confidence: null,
    sourceDocId: null, sourceLocation: null, transform: null, aiNote: 'No source found. Enter manually if applicable.' },
  { id: 'f-9', line: '9', group: 'Calculated', label: 'Total income', amount: 103694, state: 'locked',
    transform: 'Sum of lines 1a–8', formula: '1a + 2b + 3a + 7 + 8',
    calc: [
      { label: 'Line 1a', value: 92400 }, { label: 'Line 2b', value: 1204 },
      { label: 'Line 3a', value: 3980 }, { label: 'Line 7', value: 6110 }, { label: 'Line 8', value: 0 },
    ] },
  { id: 'f-10', line: '10', group: 'Adjustments', label: 'Adjustments to income', amount: 3200, prior: 3000, state: 'editable',
    sourceLocation: 'Traditional IRA contribution', transform: 'Client-entered', aiNote: 'From questionnaire: $3,200 IRA contribution.' },
  { id: 'f-11', line: '11', group: 'Calculated', label: 'Adjusted gross income (AGI)', amount: 100494, state: 'locked',
    transform: 'Line 9 − line 10', formula: '9 − 10',
    calc: [{ label: 'Total income (9)', value: 103694 }, { label: 'Adjustments (10)', value: -3200 }] },
  { id: 'f-12', line: '12', group: 'Deductions', label: 'Standard deduction', amount: 29200, state: 'readonly',
    transform: 'IRS 2025 · Married filing jointly', aiNote: 'Set by IRS filing-status table. Itemizing ($11,240 mortgage interest) would be lower, so standard wins.' },
  { id: 'f-15', line: '15', group: 'Calculated', label: 'Taxable income', amount: 71294, state: 'locked',
    transform: 'AGI − deduction', formula: '11 − 12',
    calc: [{ label: 'AGI (11)', value: 100494 }, { label: 'Std deduction (12)', value: -29200 }] },
  { id: 'f-16', line: '16', group: 'Calculated', label: 'Tax', amount: 8091, state: 'locked',
    transform: 'From 2025 tax tables', formula: 'tax_table(15)', aiNote: 'Looked up from the IRS tax table for taxable income of $71,294, MFJ.' },
  { id: 'f-25', line: '25', group: 'Payments', label: 'Federal tax withheld', amount: 14880, prior: 14100, state: 'ai', confidence: 99,
    sourceDocId: 'd-rivera-w2', sourceBox: 'box2', sourceLocation: 'Box 2 · page 1', transform: 'Copied as-is',
    aiNote: 'Withholding from the same W-2. High confidence, single source.' },
  { id: 'f-34', line: '34', group: 'Calculated', label: 'Refund', amount: 6789, state: 'locked',
    transform: 'Payments − tax', formula: '25 − 16',
    calc: [{ label: 'Withheld (25)', value: 14880 }, { label: 'Tax (16)', value: -8091 }] },
]

// ============================================================================
// GENERATED RETURNS (volume for dashboard / documents / status)
// ============================================================================
function genFieldsFor(returnId, entity) {
  // lightweight fields just so generated returns have some traceable content
  const out = []
  const w2 = money(38000, 180000)
  out.push({ id: `${returnId}-1a`, line: '1a', group: 'Income', label: 'Wages', amount: w2, state: chance(0.5) ? 'verified' : 'ai', confidence: int(78, 99), sourceLocation: 'W-2 Box 1', transform: 'Copied as-is' })
  if (chance(0.7)) out.push({ id: `${returnId}-2b`, line: '2b', group: 'Income', label: 'Interest', amount: money(50, 4000), state: chance(0.4) ? 'review' : 'ai', confidence: int(60, 96), sourceLocation: '1099-INT Box 1', transform: 'Copied as-is' })
  if (entity === 'business') out.push({ id: `${returnId}-k1`, line: 'K-1', group: 'Business', label: 'Ordinary business income', amount: money(20000, 260000), state: 'review', confidence: int(55, 85), sourceLocation: 'K-1 Part III', transform: 'Copied as-is' })
  return out
}

const returns = []
const documents = [...riveraDocs]
const tasks = []
const threads = []
const questionnaire = []

// -- hero: Rivera (returning individual, mid-flow, has a blocking issue) ------
returns.push({
  id: 'r-rivera', clientId: 'u-rivera', clientName: 'Jordan Rivera', entity: 'individual',
  form: '1040', year: YEAR, stage: 'review', preparerId: 'u-dana', reviewerId: 'u-sam',
  due: daysFromNow(9), refund: 6789, blocked: true,
  blockReason: 'Waiting on cost-basis confirmation for 2 brokerage lots (Line 7).',
  fields: riveraFields,
  fieldsTotal: riveraFields.length,
  fieldsVerified: riveraFields.filter((f) => f.state === 'verified' || f.state === 'locked' || f.state === 'readonly').length,
  openItems: 2,
})

// -- hero: Alex Chen (brand-new client, first-run onboarding, stage 0) --------
const alexDocs = [
  makeDoc('r-chen', 'u-alex', { id: 'd-chen-w2', typeDef: DOC_TYPES[0], issuer: 'Northwind Traders', name: 'W-2 - Northwind Traders', status: 'processed', uploaded: daysFromNow(-2), source: 'client-upload', boxes: [
    { key: 'box1', label: 'Box 1 - Wages', value: '61,500.00' }, { key: 'box2', label: 'Box 2 - Withheld', value: '7,410.00' },
  ] }),
]
documents.push(...alexDocs)
returns.push({
  id: 'r-chen', clientId: 'u-alex', clientName: 'Alex Chen', entity: 'individual',
  form: '1040', year: YEAR, stage: 'documents', preparerId: 'u-jordan', reviewerId: 'u-sam',
  due: daysFromNow(21), refund: null, blocked: false, isNewClient: true,
  fields: [], fieldsTotal: 12, fieldsVerified: 0, openItems: 4,
})
// Alex onboarding checklist (Challenge 03)
const alexOnboarding = [
  { id: 'ob-1', title: 'Confirm your personal details', kind: 'profile', status: 'done', minutes: 2 },
  { id: 'ob-2', title: 'Upload your W-2', kind: 'upload', status: 'done', minutes: 3, note: '1 of 1 uploaded' },
  { id: 'ob-3', title: 'Upload your 1099-INT (bank interest)', kind: 'upload', status: 'todo', minutes: 3, note: 'We saw interest on last year’s return' },
  { id: 'ob-4', title: 'Answer 4 questions about your year', kind: 'questionnaire', status: 'todo', minutes: 5, urgent: true },
  { id: 'ob-5', title: 'Review & e-sign your engagement letter', kind: 'sign', status: 'locked', minutes: 2, note: 'Unlocks after the steps above' },
]
questionnaire.push(
  { id: 'q-chen-1', returnId: 'r-chen', category: 'Life changes', question: 'Did you move to a new state in 2025?', answer: null, status: 'todo' },
  { id: 'q-chen-2', returnId: 'r-chen', category: 'Life changes', question: 'Did you have any dependents in 2025?', answer: null, status: 'todo' },
  { id: 'q-chen-3', returnId: 'r-chen', category: 'Income', question: 'Did you earn any freelance or side income?', answer: null, status: 'todo' },
  { id: 'q-chen-4', returnId: 'r-chen', category: 'Deductions', question: 'Did you contribute to an IRA or retirement account?', answer: null, status: 'todo' },
)

// -- hero: Dana's personal return (multi-role: firm employee as a client) -----
documents.push(makeDoc('r-morales', 'u-dana', {
  id: 'd-morales-w2', typeDef: DOC_TYPES[0], issuer: 'Vantage Advisors LLP', name: 'W-2 - Vantage Advisors LLP',
  pages: 1, uploaded: daysFromNow(-40), status: 'processed', source: 'client-upload',
  boxes: [
    { key: 'box1', label: 'Box 1 - Wages', value: '118,500.00' },
    { key: 'box2', label: 'Box 2 - Federal income tax withheld', value: '19,900.00' },
  ],
}))
const moralesFields = [
  { id: 'm-1a', line: '1a', group: 'Income', label: 'Wages, salaries, tips', amount: 118500, prior: 112000, state: 'verified', confidence: 98,
    sourceDocId: 'd-morales-w2', sourceBox: 'box1', sourceLocation: 'Box 1 · page 1', transform: 'Copied as-is', aiNote: 'Single employer, clean match.' },
  { id: 'm-2b', line: '2b', group: 'Income', label: 'Taxable interest', amount: 640, prior: 590, state: 'verified', confidence: 97,
    sourceLocation: '1099-INT Box 1', transform: 'Copied as-is' },
  { id: 'm-8', line: '8', group: 'Income', label: 'Other income', amount: 0, state: 'editable' },
  { id: 'm-9', line: '9', group: 'Calculated', label: 'Total income', amount: 119140, state: 'locked', transform: 'Sum of lines 1a–8', formula: '1a + 2b + 3a + 7 + 8',
    calc: [{ label: 'Line 1a', value: 118500 }, { label: 'Line 2b', value: 640 }] },
  { id: 'm-10', line: '10', group: 'Adjustments', label: 'Adjustments to income', amount: 0, state: 'editable' },
  { id: 'm-11', line: '11', group: 'Calculated', label: 'Adjusted gross income (AGI)', amount: 119140, state: 'locked', transform: 'Line 9 − line 10', formula: '9 − 10',
    calc: [{ label: 'Total income (9)', value: 119140 }, { label: 'Adjustments (10)', value: 0 }] },
  { id: 'm-12', line: '12', group: 'Deductions', label: 'Standard deduction', amount: 29200, state: 'readonly', transform: 'IRS 2025 · Married filing jointly' },
  { id: 'm-15', line: '15', group: 'Calculated', label: 'Taxable income', amount: 89940, state: 'locked', transform: 'AGI − deduction', formula: '11 − 12',
    calc: [{ label: 'AGI (11)', value: 119140 }, { label: 'Std deduction (12)', value: -29200 }] },
  { id: 'm-16', line: '16', group: 'Calculated', label: 'Tax', amount: 10329, state: 'locked', transform: 'From 2025 tax tables', formula: 'tax_table(15)' },
  { id: 'm-25', line: '25', group: 'Payments', label: 'Federal tax withheld', amount: 19900, prior: 18800, state: 'verified', confidence: 99,
    sourceDocId: 'd-morales-w2', sourceBox: 'box2', sourceLocation: 'Box 2 · page 1', transform: 'Copied as-is' },
  { id: 'm-34', line: '34', group: 'Calculated', label: 'Refund', amount: 9571, state: 'locked', transform: 'Payments − tax', formula: '25 − 16',
    calc: [{ label: 'Withheld (25)', value: 19900 }, { label: 'Tax (16)', value: -10329 }] },
]
returns.push({
  id: 'r-morales', clientId: 'u-dana', clientName: 'Dana Morales (personal)', entity: 'individual',
  form: '1040', year: YEAR, stage: 'approval', preparerId: 'u-jordan', reviewerId: 'u-sam',
  due: daysFromNow(4), refund: 9571, blocked: false, personalOf: 'u-dana',
  fields: moralesFields, fieldsTotal: moralesFields.length,
  fieldsVerified: moralesFields.filter((f) => ['verified', 'locked', 'readonly'].includes(f.state)).length, openItems: 1,
})

// -- hero: Maya Torres business return ---------------------------------------
returns.push({
  id: 'r-torres', clientId: 'u-maya', clientName: 'Torres Design Co.', entity: 'business',
  form: '1120-S', year: YEAR, stage: 'prep', preparerId: 'u-dana', reviewerId: 'u-sam',
  due: daysFromNow(2), refund: null, blocked: false,
  fields: genFieldsFor('r-torres', 'business'), fieldsTotal: 22, fieldsVerified: 9, openItems: 3,
})

// -- bulk generated returns --------------------------------------------------
const stageWeights = ['documents', 'questions', 'questions', 'prep', 'prep', 'prep', 'review', 'review', 'approval', 'filed']
for (let i = 0; i < 60; i++) {
  const entity = chance(0.28) ? 'business' : 'individual'
  const fn = pick(FIRST), ln = pick(LAST)
  const clientName = entity === 'business' ? `${ln} ${pick(['Group', 'LLC', 'Partners', 'Studio', 'Holdings', 'Co.'])}` : `${fn} ${ln}`
  const rid = `r-gen-${i}`
  const stage = pick(stageWeights)
  const preparerId = pick(PREPARERS)
  const blocked = stageIndex(stage) < 4 && chance(0.22)
  const total = int(10, 26)
  const verified = Math.round(total * (stageIndex(stage) / 6) * (0.6 + rnd() * 0.4))
  const ret = {
    id: rid, clientId: `c-gen-${i}`, clientName, entity,
    form: entity === 'business' ? pick(['1120-S', '1065']) : '1040',
    year: YEAR, stage, preparerId, reviewerId: pick(REVIEWERS),
    due: daysFromNow(int(-6, 40)),
    refund: entity === 'individual' && chance(0.6) ? money(200, 9000) : (chance(0.3) ? -money(200, 6000) : null),
    blocked,
    blockReason: blocked ? pick(['Missing a K-1 from a partnership.', 'Client hasn’t answered the residency question.', 'Awaiting signed engagement letter.', 'Prior-year AGI needed to e-file.']) : null,
    fields: genFieldsFor(rid, entity),
    fieldsTotal: total, fieldsVerified: Math.min(verified, total),
    openItems: blocked ? int(1, 4) : int(0, 3),
  }
  returns.push(ret)
  // documents for volume
  const nDocs = int(3, 9)
  for (let d = 0; d < nDocs; d++) {
    documents.push(makeDoc(rid, ret.clientId, { typeDef: pick(DOC_TYPES), issuer: pick([...EMPLOYERS, ...BANKS, ...BROKERS]) }))
  }
}

// ============================================================================
// TASKS  (Challenge 07 - the actionable dashboard feeds off these)
// ============================================================================
let taskSeq = 0
function addTask(spec) { taskSeq += 1; tasks.push({ id: `t-${taskSeq}`, status: 'open', ...spec }) }

// hero tasks (specific, high-signal)
addTask({ returnId: 'r-rivera', title: 'Confirm cost basis on 2 brokerage lots (Line 7)', kind: 'review', assigneeId: 'u-dana', due: daysFromNow(1), blocked: true, note: 'Blocking review sign-off.' })
addTask({ returnId: 'r-rivera', title: 'Resolve qualified-dividend mismatch (Line 3a)', kind: 'review', assigneeId: 'u-dana', due: daysFromNow(2), blocked: false })
addTask({ returnId: 'r-torres', title: 'Reconcile K-1 ordinary income', kind: 'prep', assigneeId: 'u-dana', due: daysFromNow(0), blocked: false })
addTask({ returnId: 'r-morales', title: 'Client approval needed before filing', kind: 'approval', assigneeId: 'u-dana', due: daysFromNow(4), blocked: false })
addTask({ returnId: 'r-chen', title: 'Chase missing 1099-INT from Alex Chen', kind: 'request', assigneeId: 'u-jordan', due: daysFromNow(3), blocked: false })

// bulk tasks derived from generated returns
for (const r of returns) {
  if (r.id.startsWith('r-gen')) {
    const n = r.openItems
    for (let k = 0; k < n; k++) {
      addTask({
        returnId: r.id,
        title: pick(['Verify wage figures', 'Request missing document', 'Answer client question', 'Second-review calculations', 'Confirm dependents', 'Reconcile 1099-B basis']),
        kind: pick(['prep', 'review', 'request', 'question']),
        assigneeId: r.preparerId,
        due: r.due, blocked: r.blocked && k === 0,
      })
    }
  }
}

// ============================================================================
// THREADS  (Challenge 02 - contextual collaboration, internal vs shared)
// ============================================================================
threads.push({
  id: 'th-basis', returnId: 'r-rivera', subject: 'Cost basis on Bluepeak brokerage lots',
  contextType: 'field', contextId: 'f-7', contextLabel: 'Line 7 · Capital gain',
  status: 'waiting-client', ownerRole: 'client', ownerUserId: 'u-rivera',
  request: { what: 'Cost-basis statement for the 2 flagged lots', due: daysFromNow(3), fulfilled: false },
  messages: [
    { authorId: 'u-dana', role: 'preparer', ts: '2026-07-20T15:02', internal: false, body: 'Hi Jordan - two lots on your Bluepeak 1099-B don’t show a cost basis. Could you upload the year-end statement that lists what you originally paid?' },
    { authorId: 'u-dana', role: 'preparer', ts: '2026-07-20T15:04', internal: true, body: 'Internal: if we can’t get basis, we default to $0 basis which inflates the gain ~$2,800. Flag to Sam before filing.' },
    { authorId: 'u-rivera', role: 'individual', ts: '2026-07-21T09:20', internal: false, body: 'Sure - is the monthly statement enough or do you need the annual gain/loss report specifically?' },
  ],
})
threads.push({
  id: 'th-div', returnId: 'r-rivera', subject: 'Qualified vs ordinary dividends',
  contextType: 'field', contextId: 'f-3a', contextLabel: 'Line 3a · Qualified dividends',
  status: 'open', ownerRole: 'firm', ownerUserId: 'u-dana',
  request: null,
  messages: [
    { authorId: 'u-sam', role: 'reviewer', ts: '2026-07-22T11:10', internal: true, body: 'Internal: double-check 1b vs 1a on the Fidelis DIV before we verify 3a. AI confidence is only 71%.' },
  ],
})
threads.push({
  id: 'th-w2', returnId: 'r-rivera', subject: 'W-2 looks good',
  contextType: 'document', contextId: 'd-rivera-w2', contextLabel: 'W-2 - Acme Corporation',
  status: 'resolved', ownerRole: 'firm', ownerUserId: 'u-dana', request: null,
  messages: [
    { authorId: 'u-dana', role: 'preparer', ts: '2026-07-18T10:00', internal: false, body: 'Your W-2 came through clean and matches what we expected. Nothing needed from you here.' },
    { authorId: 'u-rivera', role: 'individual', ts: '2026-07-18T14:30', internal: false, body: 'Great, thanks!' },
  ],
})
threads.push({
  id: 'th-chen', returnId: 'r-chen', subject: 'Missing 1099-INT',
  contextType: 'issue', contextId: 'ob-3', contextLabel: 'Onboarding · bank interest',
  status: 'waiting-client', ownerRole: 'client', ownerUserId: 'u-alex',
  request: { what: '1099-INT from your bank', due: daysFromNow(3), fulfilled: false },
  messages: [
    { authorId: 'u-jordan', role: 'seasonal', ts: '2026-07-23T16:40', internal: false, body: 'Welcome, Alex! We noticed bank interest on your prior return - could you upload this year’s 1099-INT when you get a chance?' },
  ],
})

// ============================================================================
// SHARED NOTES (Challenge 02)
// A rough tracker that sits alongside the formal threads: short jottings any
// party can leave on a return. `visibility: 'firm'` never reaches a client.
// ============================================================================
export const notes = [
  { id: 'n-1', returnId: 'r-rivera', authorId: 'u-dana', role: 'preparer', ts: '2026-07-21 09:12', visibility: 'all', done: false,
    body: 'Jordan - once you send the brokerage cost-basis statement I can close out the capital gain line and we’re done.',
    anchor: { kind: 'field', id: 'f-7', label: 'Line 7 · Capital gain' } },
  { id: 'n-2', returnId: 'r-rivera', authorId: 'u-rivera', role: 'individual', ts: '2026-07-21 19:40', visibility: 'all', done: false,
    body: 'Heads up: I switched brokers in March, so there may be two statements for the year.' },
  { id: 'n-3', returnId: 'r-rivera', authorId: 'u-dana', role: 'preparer', ts: '2026-07-22 08:05', visibility: 'firm', done: false,
    body: 'Sam - the 1099-DIV qualified/ordinary split is ambiguous. I’ve left it flagged rather than guessing; want your read before we file.',
    anchor: { kind: 'field', id: 'f-3a', label: 'Line 3a · Qualified dividends' } },
  { id: 'n-4', returnId: 'r-rivera', authorId: 'u-sam', role: 'reviewer', ts: '2026-07-22 11:30', visibility: 'firm', done: true,
    body: 'Agreed. Prior-year treatment used the ordinary figure - match that unless the broker restates.' },
  { id: 'n-5', returnId: 'r-rivera', authorId: 'u-dana', role: 'preparer', ts: '2026-07-23 14:22', visibility: 'all', done: false,
    body: 'Refund estimate will move a little once the basis question is settled - nothing to worry about.',
    anchor: { kind: 'document', id: 'd-rivera-b', label: '1099-B · Fidelity' } },
  { id: 'n-6', returnId: 'r-chen', authorId: 'u-jordan', role: 'seasonal', ts: '2026-07-23 16:45', visibility: 'all', done: false,
    body: 'Welcome aboard, Alex. Upload whatever you have and we’ll tell you what’s still missing - no need to get it perfect first time.' },
]

// ============================================================================
// ACTIVITY (feeds the notification bell)
// `audience` decides who ever sees an item; `userId`, when set, narrows it to
// one person. Live actions push additional items at runtime via the store.
// ============================================================================
export const activitySeed = [
  { id: 'a-1', kind: 'message', audience: 'firm', title: 'Jordan Rivera replied', sub: 'Cost basis on the Fidelity sale', at: '2h ago', to: '/returns/r-rivera?tab=messages&thread=th-basis' },
  { id: 'a-2', kind: 'flag', audience: 'firm', title: 'Vantage AI flagged a line', sub: 'Rivera 1040 · Line 3a dividends are ambiguous', at: '4h ago', to: '/returns/r-rivera?tab=review&field=f-3a' },
  { id: 'a-3', kind: 'doc', audience: 'firm', title: 'Document received', sub: 'Alex Chen uploaded a W-2', at: 'Yesterday', to: '/returns/r-chen?tab=documents' },
  { id: 'a-4', kind: 'approval', audience: 'firm', title: 'Ready for review', sub: 'Torres Design Co. 1120-S moved to review', at: 'Yesterday', to: '/returns/r-torres?tab=status' },
  { id: 'a-5', kind: 'note', audience: 'firm', title: 'Sam Okafor left a note', sub: 'Rivera 1040 · dividend treatment', at: '2d ago', to: '/returns/r-rivera?tab=notes' },
  { id: 'a-6', kind: 'request', audience: 'client', userId: 'u-rivera', title: 'Your preparer needs something', sub: 'Cost-basis statement for the March sale', at: '2h ago', to: '/returns/r-rivera?tab=messages&thread=th-basis' },
  { id: 'a-7', kind: 'status', audience: 'client', userId: 'u-rivera', title: 'Your return moved forward', sub: 'A specialist is reviewing it', at: 'Yesterday', to: '/returns/r-rivera?tab=status' },
  { id: 'a-8', kind: 'request', audience: 'client', userId: 'u-alex', title: 'One thing to send us', sub: '1099-INT from your bank', at: '1d ago', to: '/returns/r-chen?tab=messages&thread=th-chen' },
  { id: 'a-9', kind: 'status', audience: 'client', userId: 'u-maya', title: 'Your return moved forward', sub: 'We’re preparing your 1120-S', at: '3d ago', to: '/returns/r-torres?tab=status' },
]

// ============================================================================
// Public API
// ============================================================================
export { returns, documents, tasks, threads, questionnaire }
export const db = { users, returns, documents, tasks, threads, questionnaire, notes, onboarding: alexOnboarding, stages: STAGES }
export const notesForReturn = (rid) => notes.filter((n) => n.returnId === rid)

export const returnById = (id) => returns.find((r) => r.id === id)
export const docById = (id) => documents.find((d) => d.id === id)
export const fieldById = (rid, fid) => (returnById(rid)?.fields || []).find((f) => f.id === fid)
export const threadById = (id) => threads.find((t) => t.id === id)
export const docsForReturn = (rid) => documents.filter((d) => d.returnId === rid)
export const tasksForReturn = (rid) => tasks.filter((t) => t.returnId === rid)
export const threadsForReturn = (rid) => threads.filter((t) => t.returnId === rid)
export const returnsForClient = (uid) => returns.filter((r) => r.clientId === uid)

// counts for a quick sense of scale
export const stats = {
  returns: returns.length,
  documents: documents.length,
  tasks: tasks.length,
}
