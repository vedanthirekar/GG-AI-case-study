// Faithful excerpts from src/data/db.js — every mockup renders this same content,
// so the only thing that varies between directions is the design.
window.VERITY = {
  ret: {
    client: 'Jordan Rivera', year: 2025, form: '1040', status: 'Married filing jointly',
    stage: 'In review', due: 'in 9 days', refund: 6789,
    verified: 7, total: 13, openItems: 2,
    blockReason: 'Waiting on cost-basis confirmation for 2 brokerage lots (Line 7).',
  },

  lines: [
    { line: '1a', group: 'Income',      label: 'Wages, salaries, tips',   amount: 92400,  prior: 88000, state: 'ai',       conf: 96 },
    { line: '2b', group: 'Income',      label: 'Taxable interest',        amount: 1204,   prior: 1150,  state: 'verified', conf: 99 },
    { line: '3a', group: 'Income',      label: 'Qualified dividends',     amount: 3980,   prior: 3600,  state: 'review',   conf: 71 },
    { line: '7',  group: 'Income',      label: 'Capital gain / (loss)',   amount: 6110,   prior: 2100,  state: 'review',   conf: 68, sel: true },
    { line: '8',  group: 'Income',      label: 'Other income',            amount: 0,      prior: 0,     state: 'editable' },
    { line: '9',  group: 'Calculated',  label: 'Total income',            amount: 103694, state: 'locked', formula: '1a + 2b + 3a + 7 + 8' },
    { line: '10', group: 'Adjustments', label: 'Adjustments to income',   amount: 3200,   prior: 3000,  state: 'editable' },
    { line: '11', group: 'Calculated',  label: 'Adjusted gross income',   amount: 100494, state: 'locked', formula: '9 − 10' },
    { line: '12', group: 'Deductions',  label: 'Standard deduction',      amount: 29200,  state: 'readonly' },
    { line: '15', group: 'Calculated',  label: 'Taxable income',          amount: 71294,  state: 'locked', formula: '11 − 12' },
    { line: '16', group: 'Calculated',  label: 'Tax',                     amount: 8091,   state: 'locked', formula: 'tax_table(15)' },
    { line: '25', group: 'Payments',    label: 'Federal tax withheld',    amount: 14880,  prior: 14100, state: 'ai', conf: 99 },
    { line: '34', group: 'Calculated',  label: 'Refund',                  amount: 6789,   state: 'locked', formula: '25 − 16' },
  ],

  doc: {
    name: '1099-B — Bluepeak Securities', issuer: 'Bluepeak Securities',
    pages: 4, page: 1, uploaded: '18 Feb 2026', source: 'Imported', status: 'Needs review',
    boxes: [
      { label: 'Payer',                 value: 'Bluepeak Securities' },
      { label: 'Proceeds',              value: '48,900.00' },
      { label: 'Cost basis (reported)', value: '42,790.00' },
      { label: 'Net gain/loss',         value: '6,110.00', hit: true },
    ],
  },

  trace: [
    { k: 'Source document', v: '1099-B · Bluepeak Securities' },
    { k: 'Field on document', v: 'Net gain/loss · page 1' },
    { k: 'Transform', v: 'Proceeds − cost basis' },
    { k: 'Return line', v: 'Line 7 · $6,110' },
  ],

  ai: {
    conf: 68,
    note: 'Two lots on the 1099-B show “basis not reported to IRS.” Gain may change once basis is confirmed.',
    flag: 'Cost basis on 2 of 11 lots is unverified.',
    anomaly: 'Nearly 3× last year — driven by the two lots with unconfirmed basis.',
    candidates: [
      { label: 'Basis as reported ($42,790)', value: 6110, conf: 68, rec: true,
        why: 'Use the cost basis the broker reported on the 9 covered lots and the client’s figure for the other 2.' },
      { label: 'Assume $0 basis on 2 lots', value: 8910, conf: 55,
        why: 'Conservative: treat the 2 unconfirmed lots as $0 basis until a statement arrives.' },
    ],
  },

  queue: [
    { client: 'Jordan Rivera',    form: '1040', stage: 'In review',    due: '9d',  amount: 6789,   risk: 'high', flag: 'Cost basis unverified · 2 lots',        open: 2, conf: 68 },
    { client: 'Meridian Holdings', form: '1120S', stage: 'In review',   due: '4d',  amount: -18420, risk: 'high', flag: 'K-1 allocation mismatch',              open: 3, conf: 61 },
    { client: 'Amara Osei',       form: '1040', stage: 'In preparation', due: '12d', amount: 2140, risk: 'med',  flag: 'Two 1099-NECs, one unmatched',          open: 1, conf: 74 },
    { client: 'Beckett & Cole LLP', form: '1065', stage: 'In review',   due: '6d',  amount: 0,      risk: 'med',  flag: 'Partner basis schedule incomplete',    open: 2, conf: 70 },
    { client: 'Priya Raman',      form: '1040', stage: 'Awaiting client', due: '15d', amount: 4310, risk: 'low', flag: 'Waiting on signed 8879',                open: 1, conf: 92 },
    { client: 'Northwind Foods',  form: '1120', stage: 'In preparation', due: '21d', amount: -6200, risk: 'low', flag: 'Depreciation schedule imported',        open: 0, conf: 88 },
    { client: 'Devon Whitaker',   form: '1040', stage: 'Document intake', due: '28d', amount: 0,    risk: 'low', flag: '3 of 7 documents received',             open: 4, conf: null },
    { client: 'Sana Qureshi',     form: '1040', stage: 'In review',      due: '3d',  amount: 11040, risk: 'high', flag: 'Foreign tax credit needs a second look', open: 2, conf: 58 },
  ],

  stats: [
    { k: 'Needs your review',  v: '12', sub: '4 blocked' },
    { k: 'Due this week',      v: '7',  sub: '2 overdue' },
    { k: 'AI-extracted fields', v: '1,284', sub: '86% above 90% confidence' },
    { k: 'Filed this season',  v: '41', sub: '+9 vs. last week' },
  ],

  nav: [
    { icon: 'grid',   label: 'Dashboard', screen: 'dash' },
    { icon: 'folder', label: 'Returns',   screen: 'review', active: true },
    { icon: 'doc',    label: 'Documents' },
    { icon: 'chat',   label: 'Messages',  badge: 3 },
    { icon: 'check',  label: 'Tasks',     badge: 8 },
    { icon: 'users',  label: 'Clients' },
  ],
}
