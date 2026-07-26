// Help & guides (Challenges 03 & 09).
// A product this deep needs a place that answers "where do I start?" and "what
// does this mean?" without anyone having to ask a human. The content is
// role-aware — a first-time taxpayer and a reviewer get different starting
// points from the same screen — and the reference sections pull the *live*
// vocabulary (affordance states, lifecycle stages) rather than describing it
// twice and letting the two drift apart.
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { START_HERE, FAQ, GUIDES, SUPPORT, forAudience } from '../../data/help'
import { STAGES } from '../../data/catalog'
import { useSession } from '../../context/SessionContext'
import { useChrome } from '../../context/ChromeContext'
import { AffordanceLegend } from '../../components/affordances/StateBadge'
import PageHeader from '../../components/shell/PageHeader'
import { Card, Btn, Icon, Tag, EmptyState, Kbd, cx } from '../../components/ui'

const SECTIONS = [
  { key: 'start', label: 'Start here', icon: 'compass' },
  { key: 'faq', label: 'Questions', icon: 'help' },
  { key: 'guides', label: 'How Verity works', icon: 'book' },
  { key: 'interaction-system', label: 'Reading the interface', icon: 'grid' },
  { key: 'support', label: 'Contact support', icon: 'life-buoy' },
]

export default function HelpCenter() {
  const { section = 'start' } = useParams()
  const { isFirm, user } = useSession()
  const { publish } = useChrome()
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  useEffect(() => {
    publish({ crumbs: [{ label: 'Help & guides', to: '/help' }, { label: SECTIONS.find((s) => s.key === section)?.label }] })
  }, [publish, section])

  const faqs = useMemo(() => forAudience(FAQ, isFirm), [isFirm])
  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return null
    return faqs.filter((f) => (f.q + f.a + f.cat).toLowerCase().includes(term))
  }, [q, faqs])

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <PageHeader eyebrow="Help & guides" icon="life-buoy"
        title={`How can we help, ${user?.name.split(' ')[0]}?`}
        subtitle={isFirm
          ? 'Working guidance for firm staff — reviewing, the AI, permissions and collaboration.'
          : 'Everything about your return, in plain language. No tax jargon unless we explain it.'} />

      {/* search sits above the sections — it's the fastest path for most people */}
      <div className="relative mt-5">
        <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help — try “status”, “refund”, “locked”…"
          className="w-full rounded-xl2 border border-line bg-surface py-3 pl-10 pr-4 text-lead outline-none transition placeholder:text-faint focus:border-accent focus:shadow-glow" />
        {q && (
          <button onClick={() => setQ('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-faint hover:text-ink"><Icon name="x" size={15} /></button>
        )}
      </div>

      {results ? (
        <div className="mt-5">
          <div className="mb-2 text-micro font-bold uppercase tracking-wider text-faint">
            {results.length} result{results.length === 1 ? '' : 's'} for “{q}”
          </div>
          {results.length === 0
            ? <EmptyState icon="search" title="No matches" body="Try a different word, or contact support below."
                action={<Btn variant="default" onClick={() => { setQ(''); navigate('/help/support') }}>Contact support</Btn>} />
            : <div className="space-y-2">{results.map((f) => <FaqItem key={f.id} f={f} defaultOpen />)}</div>}
        </div>
      ) : (
        <>
          {/* section tabs */}
          <div className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-line">
            {SECTIONS.map((s) => (
              <button key={s.key} onClick={() => navigate(`/help/${s.key}`)}
                className={cx('flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-body font-semibold transition',
                  section === s.key ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-ink')}>
                <Icon name={s.icon} size={14} /> {s.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {section === 'start' && <StartHere isFirm={isFirm} />}
            {section === 'faq' && <Questions faqs={faqs} />}
            {section === 'guides' && <Guides isFirm={isFirm} />}
            {section === 'interaction-system' && <InteractionSystem />}
            {section === 'support' && <Support isFirm={isFirm} />}
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Start here -------------------------------------------------------
function StartHere({ isFirm }) {
  const cards = START_HERE[isFirm ? 'firm' : 'client']
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((c, i) => (
          <Link key={c.title} to={c.to}>
            <Card hover className="h-full p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent"><Icon name={c.icon} size={16} /></span>
                <span className="text-micro font-bold text-faint">STEP {i + 1}</span>
              </div>
              <div className="mt-2.5 font-display text-lead font-bold">{c.title}</div>
              <p className="mt-1 text-body leading-relaxed text-muted">{c.body}</p>
              <div className="mt-3 flex items-center gap-1 text-meta font-semibold text-accent">Go there <Icon name="arrow-right" size={13} /></div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-1.5 text-meta font-bold uppercase tracking-wider text-faint">
          <Icon name="bolt" size={13} /> Shortcuts worth knowing
        </div>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
          <Shortcut keys={['⌘', 'K']} label="Search returns, documents and people" />
          <Shortcut keys={['?']} label="Help for the screen you're on" />
          {isFirm && <Shortcut keys={['j', 'k']} label="Move through the review queue" />}
          {isFirm && <Shortcut keys={['a']} label="Accept the selected figure" />}
        </div>
      </Card>

      <div className="mt-4 rounded-xl2 border border-accent/25 bg-accent-soft/50 p-4">
        <div className="flex items-center gap-2 text-body font-semibold text-accent">
          <Icon name="route" size={15} /> Prefer to be shown around?
        </div>
        <p className="mt-1 text-body text-muted">
          Take a tour from the top bar — it drives the real product through everything it does, in order.
        </p>
      </div>
    </>
  )
}

function Shortcut({ keys, label }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-bgtint/60 px-3 py-2">
      <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
      <span className="text-body text-muted">{label}</span>
    </div>
  )
}

// ---------- FAQ --------------------------------------------------------------
function Questions({ faqs }) {
  const cats = useMemo(() => {
    const m = new Map()
    faqs.forEach((f) => { if (!m.has(f.cat)) m.set(f.cat, []); m.get(f.cat).push(f) })
    return [...m.entries()]
  }, [faqs])

  return (
    <div className="space-y-5">
      {cats.map(([cat, list]) => (
        <div key={cat}>
          <div className="mb-2 text-micro font-bold uppercase tracking-wider text-faint">{cat}</div>
          <div className="space-y-2">{list.map((f) => <FaqItem key={f.id} f={f} />)}</div>
        </div>
      ))}
    </div>
  )
}

function FaqItem({ f, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
        <span className="flex-1 text-body font-semibold">{f.q}</span>
        {defaultOpen && <Tag tone="muted">{f.cat}</Tag>}
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={15} className="shrink-0 text-faint" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }} className="overflow-hidden">
            <p className="border-t border-line2 px-4 py-3 text-body leading-relaxed text-muted">{f.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ---------- Guides -----------------------------------------------------------
function Guides({ isFirm }) {
  return (
    <>
      <div className="space-y-3">
        {forAudience(GUIDES, isFirm).map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-ai-soft text-ai"><Icon name={g.icon} size={16} /></span>
              <span className="font-display text-lead font-bold">{g.title}</span>
            </div>
            <p className="mt-2 text-body leading-relaxed text-muted">{g.body}</p>
          </Card>
        ))}
      </div>

      {/* the status vocabulary, straight from the source used by every screen */}
      <div className="mt-5">
        <div className="mb-2 text-micro font-bold uppercase tracking-wider text-faint">The six stages of a return</div>
        <Card className="divide-y divide-line2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="flex items-start gap-3 px-4 py-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-line text-micro font-bold text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold">{isFirm ? s.staffLabel : s.clientLabel}</div>
                <div className="text-meta text-muted">{s.desc}</div>
              </div>
              {isFirm && <Tag tone="muted">clients see “{s.clientLabel}”</Tag>}
            </div>
          ))}
        </Card>
        <p className="mt-2 text-micro text-faint">
          One vocabulary, two audiences — the same underlying stage, worded for whoever is reading it.
        </p>
      </div>
    </>
  )
}

// ---------- Interaction system (formerly /styleguide) ------------------------
function InteractionSystem() {
  return (
    <>
      <p className="text-body leading-relaxed text-muted">
        Every value in Verity carries one of six states, shown identically on every screen — so you
        always know what you can touch, and why you can't touch the rest.
      </p>
      <div className="mt-4"><AffordanceLegend /></div>
      <Card className="mt-4 p-4">
        <div className="text-body font-semibold">Why locked things stay visible</div>
        <p className="mt-1 text-body leading-relaxed text-muted">
          When your role can't do something, the control stays on screen and explains itself rather than
          disappearing. Hiding it would leave you with a different mental model of the product than your
          colleague has — and no way to discover what you'd need in order to proceed.
        </p>
      </Card>
    </>
  )
}

// ---------- Support ----------------------------------------------------------
function Support({ isFirm }) {
  const [sent, setSent] = useState(false)
  const [topic, setTopic] = useState('Something looks wrong')
  const [detail, setDetail] = useState('')

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {forAudience(SUPPORT, isFirm).map((s) => (
          <Card key={s.title} className="p-4">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-good-soft text-good"><Icon name={s.icon} size={16} /></span>
            <div className="mt-2.5 text-body font-bold">{s.title}</div>
            <p className="mt-1 text-meta leading-relaxed text-muted">{s.body}</p>
            {s.to && <Link to={s.to}><Btn variant="default" size="sm" className="mt-2.5">{s.cta} <Icon name="arrow-right" size={12} /></Btn></Link>}
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <div className="font-display text-lead font-bold">Report a problem</div>
        <p className="mt-0.5 text-body text-muted">Tell us what happened and we'll pick it up from here.</p>
        {sent ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl2 border border-good/30 bg-good-soft px-4 py-3 text-body font-medium text-good">
            <Icon name="check" size={16} /> Thanks — reference <b className="font-mono">VT-{Math.floor(Math.random() * 9000) + 1000}</b>. We'll be in touch within one working day.
          </div>
        ) : (
          <form className="mt-3 space-y-2.5" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-body font-medium text-ink outline-none focus:border-accent">
              {['Something looks wrong', 'A figure seems incorrect', 'I can’t access something', 'A document didn’t upload', 'Something else'].map((t) => <option key={t}>{t}</option>)}
            </select>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder="What were you doing when it happened?"
              className="w-full resize-none rounded-lg border border-line bg-surface p-3 text-body outline-none placeholder:text-faint focus:border-accent" />
            <div className="flex items-center justify-between">
              <span className="text-micro text-faint">We'll include the screen you were on automatically.</span>
              <Btn variant="primary" type="submit" disabled={!detail.trim()}>Send report <Icon name="arrow-right" size={13} /></Btn>
            </div>
          </form>
        )}
      </Card>
    </>
  )
}
