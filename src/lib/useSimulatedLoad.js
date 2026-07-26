import { useEffect, useState } from 'react'

// A short, deliberately fake loading beat.
// There is no backend here, so lists would otherwise appear instantaneously and
// the product would feel like a slideshow of static screens. This gives search
// and filter changes a brief skeleton, which is both more honest about what a
// real deployment would do and a better read of whether the loading states are
// designed. Documented as simulated in the README.
export default function useSimulatedLoad(deps = [], ms = 260) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return loading
}
