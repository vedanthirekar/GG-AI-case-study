// One stage, rendered with the audience-appropriate label (Challenge 06).
// Both client and staff read the SAME underlying stage; only the wording differs.
import { STAGES, stageIndex } from '../../data/catalog'
import { Tag } from '../../components/ui'

const TONE = ['muted', 'accent', 'accent', 'warn', 'ai', 'good']

export default function StageChip({ stageKey, audience = 'staff' }) {
  const i = stageIndex(stageKey)
  const s = STAGES[i]
  if (!s) return null
  return <Tag tone={TONE[i]} dot>{audience === 'client' ? s.clientLabel : s.staffLabel}</Tag>
}
