// The assistant's launcher, bottom-right.
//
// Deliberately not a glossy circular bubble: this direction prints on paper, so
// the launcher is a squared card with a hairline rule and the same sparkle mark
// the AI carries everywhere else in the product. It holds no state of its own -
// it opens the existing help drawer on the Ask tab.
import { motion, AnimatePresence } from 'framer-motion'
import { useAssistant } from '../../context/AssistantContext'
import { Icon } from '../../components/ui'

export default function AssistantFab({ hidden, onOpen }) {
  const { live } = useAssistant()

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          onClick={onOpen}
          aria-label="Ask Vantage"
          title="Ask Vantage"
          className="fixed bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-xl2 border border-ai/40 bg-surface px-3 py-2 shadow-e3 transition hover:border-ai hover:bg-ai-soft/60">
          <Icon name="sparkle" size={15} className="shrink-0 text-ai" />
          <span className="text-body font-semibold text-ink">Ask Vantage</span>
          {live && <span className="sr-only">AI powered</span>}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
