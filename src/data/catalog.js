// Static vocabulary shared across the whole product.
// Keeping status/stage names in ONE place is how Challenge 06 stays consistent:
// clients and staff read the same labels because they come from the same source.

// ---- Roles (Challenge 05) ---------------------------------------------------
export const ROLES = {
  individual: { key: 'individual', label: 'Individual taxpayer', side: 'client', short: 'Client' },
  business: { key: 'business', label: 'Business owner', side: 'client', short: 'Business' },
  preparer: { key: 'preparer', label: 'Tax preparer', side: 'firm', short: 'Preparer' },
  reviewer: { key: 'reviewer', label: 'Reviewer', side: 'firm', short: 'Reviewer' },
  admin: { key: 'admin', label: 'Firm administrator', side: 'firm', short: 'Admin' },
  seasonal: { key: 'seasonal', label: 'Seasonal staff', side: 'firm', short: 'Seasonal' },
}

// ---- Return lifecycle stages (Challenge 06) ---------------------------------
// One ordered vocabulary. `clientLabel` is what the taxpayer sees; `staffLabel`
// is the firm-facing wording. Same underlying stage - appropriate detail per audience.
export const STAGES = [
  { key: 'documents', clientLabel: 'Gathering your documents', staffLabel: 'Document intake', desc: 'Collecting the forms needed to start.' },
  { key: 'questions', clientLabel: 'A few questions for you', staffLabel: 'Client questionnaire', desc: 'Answers we need before preparing.' },
  { key: 'prep', clientLabel: "We're preparing your return", staffLabel: 'In preparation', desc: 'A preparer is building the return.' },
  { key: 'review', clientLabel: 'A specialist is reviewing it', staffLabel: 'In review', desc: 'A reviewer is checking the work.' },
  { key: 'approval', clientLabel: 'Ready for your approval', staffLabel: 'Awaiting client approval', desc: 'Client sign-off before filing.' },
  { key: 'filed', clientLabel: 'Filed with the IRS', staffLabel: 'Filed', desc: 'Submitted and accepted.' },
]
export const stageIndex = (key) => STAGES.findIndex((s) => s.key === key)

// ---- Field interaction states (Challenge 08 - clickable vs editable) --------
// The single visual language for affordances, reused on every screen.
export const FIELD_STATES = {
  ai: {
    key: 'ai', label: 'AI extracted', short: 'AI',
    desc: 'Pulled from a source document by Vantage AI. Review before it counts as verified.',
    editable: true, approvable: true,
  },
  verified: {
    key: 'verified', label: 'Verified', short: 'Verified',
    desc: 'A person confirmed this value against its source.',
    editable: true, approvable: false,
  },
  review: {
    key: 'review', label: 'Needs review', short: 'Review',
    desc: 'Flagged for a human to look at - low confidence or a mismatch.',
    editable: true, approvable: true,
  },
  editable: {
    key: 'editable', label: 'Editable', short: 'Editable',
    desc: 'You can type a value here directly.',
    editable: true, approvable: false,
  },
  locked: {
    key: 'locked', label: 'Locked · formula', short: 'Locked',
    desc: 'Calculated from other lines. Change the inputs, not this field.',
    editable: false, approvable: false,
  },
  readonly: {
    key: 'readonly', label: 'Read-only', short: 'Read-only',
    desc: 'Set by the IRS or firm policy and cannot be changed here.',
    editable: false, approvable: false,
  },
}

// ---- Document categories & types --------------------------------------------
export const DOC_CATEGORIES = ['Income', 'Deductions', 'Investments', 'Business', 'Property', 'Identity', 'Prior year']
export const DOC_TYPES = [
  { type: 'W-2', cat: 'Income', label: 'Wage statement' },
  { type: '1099-INT', cat: 'Income', label: 'Interest income' },
  { type: '1099-DIV', cat: 'Investments', label: 'Dividend income' },
  { type: '1099-NEC', cat: 'Income', label: 'Nonemployee comp.' },
  { type: '1099-B', cat: 'Investments', label: 'Brokerage proceeds' },
  { type: '1099-R', cat: 'Income', label: 'Retirement dist.' },
  { type: 'K-1', cat: 'Business', label: 'Partnership share' },
  { type: '1098', cat: 'Deductions', label: 'Mortgage interest' },
  { type: '1098-T', cat: 'Deductions', label: 'Tuition statement' },
  { type: '1095-A', cat: 'Deductions', label: 'Health coverage' },
  { type: 'Receipt', cat: 'Deductions', label: 'Expense receipt' },
  { type: 'Bank statement', cat: 'Property', label: 'Bank statement' },
  { type: 'Prior 1040', cat: 'Prior year', label: 'Prior-year return' },
  { type: 'ID', cat: 'Identity', label: 'Photo ID' },
]

export const DOC_STATUS = {
  processed: { key: 'processed', label: 'Processed', tone: 'good' },
  'needs-review': { key: 'needs-review', label: 'Needs review', tone: 'warn' },
  received: { key: 'received', label: 'Received', tone: 'muted' },
  requested: { key: 'requested', label: 'Requested', tone: 'danger' },
}

// ---- Sample names for generated data ----------------------------------------
export const FIRST = ['James', 'Maria', 'Robert', 'Linda', 'David', 'Sarah', 'Michael', 'Emily', 'Daniel', 'Olivia', 'Wei', 'Priya', 'Omar', 'Ana', 'Ken', 'Grace', 'Hassan', 'Nina', 'Luis', 'Fatima', 'Tom', 'Yuki', 'Carlos', 'Aisha']
export const LAST = ['Rivera', 'Chen', 'Patel', 'Johnson', 'Nguyen', 'Garcia', 'Kim', 'Okafor', 'Silva', 'Cohen', 'Müller', 'Rossi', 'Haddad', 'Novak', 'Reyes', 'Andersson', 'Osei', 'Ivanov', 'Diaz', 'Khan', 'Brooks', 'Tan', 'Flores', 'Ali']
export const EMPLOYERS = ['Acme Corporation', 'Northwind Traders', 'Globex LLC', 'Initech', 'Umbrella Health', 'Stark Industries', 'Wayne Freight', 'Hooli', 'Pied Piper', 'Vandelay Imports', 'Wonka Foods', 'Cyberdyne', 'Soylent Green Co.', 'Gekko Capital']
export const BANKS = ['First National', 'Coastal Credit Union', 'Meridian Bank', 'Harbor Savings', 'Summit Financial', 'Cornerstone Trust']
export const BROKERS = ['Fidelis Brokerage', 'Vanguard-ish Funds', 'Bluepeak Securities', 'Ironwood Wealth']
