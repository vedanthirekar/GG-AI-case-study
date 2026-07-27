// One markup renderer for all six directions. Every element carries a class hook,
// and each theme's CSS restyles *and recomposes* from these same nodes - which is
// exactly how the real app works (tokens + utilities, one component tree).
const D = window.VANTAGE

const money = (n, opts = {}) => {
  const neg = n < 0
  const s = '$' + Math.abs(n).toLocaleString('en-US')
  return `<span class="money ${neg ? 'is-neg' : ''} ${opts.big ? 'is-big' : ''}">${neg ? '(' + s + ')' : s}</span>`
}

const ICONS = {
  grid:   '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  doc:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5"/>',
  chat:   '<path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-5.5A8 8 0 1 1 21 12z"/>',
  check:  '<path d="M20 6 9 17l-5-5"/>',
  users:  '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bell:   '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  spark:  '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  lock:   '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  alert:  '<path d="M12 9v5M12 18h.01M10.3 3.9 2.4 17.2A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  arrow:  '<path d="M5 12h14M13 6l6 6-6 6"/>',
  down:   '<path d="M6 9l6 6 6-6"/>',
}
const icon = (n, cls = '') =>
  `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`

const STATE_LABEL = {
  ai: 'AI extracted', verified: 'Verified', review: 'Needs review',
  editable: 'Editable', locked: 'Locked · formula', readonly: 'Read-only',
}
const badge = (state, conf) => `
  <span class="badge is-${state}">
    <span class="badge-dot"></span>
    <span class="badge-txt">${STATE_LABEL[state]}</span>
    ${conf != null ? `<span class="badge-conf">${conf}%</span>` : ''}
  </span>`

// ---------------------------------------------------------------- app frame
const sidebar = () => `
  <aside class="rail">
    <div class="brand">
      <span class="brand-mark">V</span>
      <span class="brand-name">Vantage</span>
    </div>
    <nav class="nav">
      ${D.nav.map((n) => `
        <button class="nav-item ${n.active ? 'is-active' : ''}" data-screen="${n.screen || ''}">
          ${icon(n.icon)}
          <span class="nav-label">${n.label}</span>
          ${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}
        </button>`).join('')}
    </nav>
    <div class="rail-foot">
      <div class="acct">
        <span class="avatar">DM</span>
        <span class="acct-txt">
          <span class="acct-name">Dana Morales</span>
          <span class="acct-role">Preparer</span>
        </span>
      </div>
    </div>
  </aside>`

const topbar = (crumbs) => `
  <header class="topbar">
    <nav class="crumbs">${crumbs.map((c, i) =>
      `${i ? '<span class="crumb-sep">/</span>' : ''}<span class="crumb ${i === crumbs.length - 1 ? 'is-last' : ''}">${c}</span>`).join('')}</nav>
    <div class="topbar-tools">
      <button class="search">${icon('search')}<span>Search returns, documents, people</span><kbd>⌘K</kbd></button>
      <button class="icon-btn">${icon('bell')}<span class="dot"></span></button>
      <button class="tour-btn">${icon('spark')}<span>Show me around</span></button>
    </div>
  </header>`

// ------------------------------------------------------------ screen: review
const reviewScreen = () => {
  const r = D.ret
  return `
  <section class="screen screen-review">
    <div class="ret-head">
      <div class="ret-id">
        <h1 class="ret-client">${r.client}</h1>
        <span class="ret-meta">${r.year} · Form ${r.form} · ${r.status}</span>
      </div>
      <div class="ret-facts">
        <span class="fact"><span class="fact-k">Stage</span><span class="fact-v stage">${r.stage}</span></span>
        <span class="fact"><span class="fact-k">Due</span><span class="fact-v">${r.due}</span></span>
        <span class="fact"><span class="fact-k">Verified</span><span class="fact-v">${r.verified} of ${r.total}</span></span>
        <span class="fact fact-refund"><span class="fact-k">Refund</span><span class="fact-v">${money(r.refund, { big: true })}</span></span>
      </div>
    </div>

    <div class="blocked">${icon('alert')}<span><b>Blocked.</b> ${r.blockReason}</span></div>

    <div class="split">
      <!-- pane 1: the return -->
      <div class="pane pane-lines">
        <div class="pane-head"><h2>Return lines</h2><span class="pane-sub">Form 1040 · ${D.lines.length} lines</span></div>
        <div class="lines">
          ${D.lines.map((f) => `
            <div class="line ${f.sel ? 'is-sel' : ''} state-${f.state}" ${f.sel ? 'id="sel-line"' : ''}>
              <span class="line-no">${f.line}</span>
              <span class="line-body">
                <span class="line-label">${f.label}</span>
                <span class="line-sub">${f.formula ? `= ${f.formula}` : f.prior != null ? `Prior year ${money(f.prior)}` : '&nbsp;'}</span>
              </span>
              <span class="line-right">
                ${money(f.amount)}
                ${badge(f.state, f.conf)}
              </span>
            </div>`).join('')}
        </div>
      </div>

      <!-- pane 2: the source document -->
      <div class="pane pane-doc">
        <div class="pane-head">
          <h2>${D.doc.name}</h2>
          <span class="pane-sub">${D.doc.source} · ${D.doc.uploaded} · <em class="doc-status">${D.doc.status}</em></span>
        </div>
        <div class="doc-tools">
          <span class="pager">Page ${D.doc.page} of ${D.doc.pages}</span>
          <span class="zoom"><button>−</button><span>100%</span><button>+</button></span>
        </div>
        <div class="paper">
          <div class="paper-head">
            <span class="paper-form">Form 1099-B</span>
            <span class="paper-year">2025</span>
          </div>
          <div class="paper-issuer">${D.doc.issuer}</div>
          ${D.doc.boxes.map((b) => `
            <div class="pbox ${b.hit ? 'is-hit' : ''}" ${b.hit ? 'id="hit-box"' : ''}>
              <span class="pbox-k">${b.label}</span>
              <span class="pbox-v">${b.value}</span>
            </div>`).join('')}
          <div class="paper-note">Lots 7 and 11: <b>basis not reported to IRS</b></div>
        </div>
      </div>

      <!-- pane 3: trace + AI -->
      <div class="pane pane-trace">
        <div class="pane-head"><h2>Where this number came from</h2><span class="pane-sub">Line 7 · Capital gain</span></div>

        <ol class="trace" id="trace">
          ${D.trace.map((t, i) => `
            <li class="tnode" style="--i:${i}">
              <span class="tnode-k">${t.k}</span>
              <span class="tnode-v">${t.v}</span>
            </li>`).join('')}
        </ol>

        <div class="ai">
          <div class="ai-head">
            ${icon('spark', 'ai-ic')}
            <span class="ai-title">Vantage AI</span>
            <span class="ai-conf">${D.ai.conf}% confident</span>
          </div>
          <p class="ai-note">${D.ai.note}</p>
          <div class="ai-flag">${icon('alert')}<span>${D.ai.flag}</span></div>
          <div class="ai-anom">${D.ai.anomaly}</div>

          <div class="ai-label">Two defensible readings - pick one</div>
          ${D.ai.candidates.map((c) => `
            <button class="cand ${c.rec ? 'is-rec' : ''}">
              <span class="cand-top">
                <span class="cand-label">${c.label}</span>
                ${c.rec ? '<span class="cand-rec">Recommended</span>' : ''}
              </span>
              <span class="cand-why">${c.why}</span>
              <span class="cand-foot">${money(c.value)}<span class="cand-conf">${c.conf}% confident</span></span>
            </button>`).join('')}

          <div class="ai-acts">
            <button class="btn btn-primary">Accept &amp; verify</button>
            <button class="btn">Ask the client</button>
          </div>
        </div>
      </div>
    </div>
  </section>`
}

// --------------------------------------------------------- screen: dashboard
const RISK = { high: 'High', med: 'Medium', low: 'Low' }
const dashScreen = () => `
  <section class="screen screen-dash">
    <div class="dash-head">
      <div>
        <h1 class="dash-title">Your queue</h1>
        <p class="dash-sub">Ranked by what will cost the most to get wrong - deadline, unresolved flags, and AI confidence.</p>
      </div>
      <div class="dash-acts">
        <button class="btn">Filter</button>
        <button class="btn btn-primary">Start next return ${icon('arrow')}</button>
      </div>
    </div>

    <div class="stats">
      ${D.stats.map((s) => `
        <div class="stat">
          <span class="stat-k">${s.k}</span>
          <span class="stat-v">${s.v}</span>
          <span class="stat-sub">${s.sub}</span>
        </div>`).join('')}
    </div>

    <div class="queue">
      <div class="queue-head">
        <span>Client</span><span>Form</span><span>Stage</span><span>Due</span>
        <span>What needs attention</span><span class="ta-r">Refund / (owed)</span><span class="ta-r">Confidence</span>
      </div>
      ${D.queue.map((q) => `
        <div class="qrow risk-${q.risk}">
          <span class="q-client">
            <span class="q-risk" title="${RISK[q.risk]} priority"></span>
            <span class="q-name">${q.client}</span>
          </span>
          <span class="q-form">${q.form}</span>
          <span class="q-stage"><span class="stage-pill">${q.stage}</span></span>
          <span class="q-due">${q.due}</span>
          <span class="q-flag">
            <span class="q-flag-txt">${q.flag}</span>
            ${q.open ? `<span class="q-open">${q.open} open</span>` : ''}
          </span>
          <span class="q-amt">${q.amount ? money(q.amount) : '<span class="q-none">-</span>'}</span>
          <span class="q-conf">${q.conf != null
            ? `<span class="conf-bar"><span style="width:${q.conf}%"></span></span><span class="conf-num">${q.conf}%</span>`
            : '<span class="q-none">not started</span>'}</span>
        </div>`).join('')}
    </div>
  </section>`

// ------------------------------------------------------------------ mount
const CRUMBS = { review: ['Returns', 'Jordan Rivera 2025', 'Review'], dash: ['Dashboard'] }
let screen = 'review'

function render() {
  document.getElementById('app').innerHTML = `
    ${sidebar()}
    <div class="main">
      ${topbar(CRUMBS[screen])}
      <div class="content">${screen === 'review' ? reviewScreen() : dashScreen()}</div>
    </div>`
  document.querySelectorAll('.nav-item[data-screen]').forEach((b) => {
    if (!b.dataset.screen) return
    b.onclick = () => { screen = b.dataset.screen; syncToggle(); render() }
  })
  if (screen === 'review') traceAnim()
}

// The signature moment, identical in all six so motion can be compared:
// the trace chain draws itself from the document box to the return line.
function traceAnim() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || !window.gsap) return

  // gsap.from() hides the element until its tween runs, so a timeline that never
  // starts - a backgrounded tab throttles rAF, a lazy iframe, a slow CDN - would
  // leave the trace and the AI card permanently invisible. Give the animation a
  // hard deadline that restores the natural state no matter what.
  const soft = ['.tnode', '.ai']
  const safety = setTimeout(() => gsap.set(soft, { clearProps: 'all' }), 2400)

  const tl = gsap.timeline({ delay: 0.15, onComplete: () => clearTimeout(safety) })
  tl.from('.tnode', { opacity: 0, y: 10, duration: 0.34, stagger: 0.09, ease: 'power2.out' })
    .to('#hit-box', { scale: 1.03, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '-=0.30')
    .fromTo('#sel-line', { backgroundPosition: '200% 0' }, { backgroundPosition: '0% 0', duration: 0.5, ease: 'power1.inOut' }, '-=0.30')
    .from('.ai', { opacity: 0, y: 12, duration: 0.36, ease: 'power2.out' }, '-=0.30')
}

function syncToggle() {
  document.querySelectorAll('.toggle button').forEach((b) =>
    b.classList.toggle('is-on', b.dataset.screen === screen))
}

document.querySelectorAll('.toggle button').forEach((b) => {
  b.onclick = () => { screen = b.dataset.screen; syncToggle(); render() }
})
syncToggle()
render()
