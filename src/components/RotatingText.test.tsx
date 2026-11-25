import { act, render } from '@testing-library/react'
import { createRef, startTransition, Suspense, use } from 'react'
import RotatingText, { type RotatingTextRef } from './RotatingText'

const pending = new Promise<never>(() => undefined)
function Suspend({ active }: { active: boolean }) {
  if (active) use(pending)
  return null
}

it('keeps callbacks from suspended renders out of the committed rotation', async () => {
  const ref = createRef<RotatingTextRef>()
  const committed = vi.fn()
  const uncommitted = vi.fn()
  const view = (onNext: (index: number) => void, suspend: boolean) => (
    <Suspense fallback="Loading">
      <RotatingText ref={ref} texts={['one', 'two', 'three']} auto={false} onNext={onNext} />
      <Suspend active={suspend} />
    </Suspense>
  )
  const { rerender } = render(view(committed, false))
  await act(async () => { startTransition(() => { rerender(view(uncommitted, true)) }) })
  expect(ref.current).not.toBeNull()
  await act(async () => { ref.current?.next() })
  expect(committed).toHaveBeenCalledWith(1)
  expect(uncommitted).not.toHaveBeenCalled()
  rerender(view(uncommitted, false))
  await act(async () => { ref.current?.next() })
  expect(uncommitted).toHaveBeenCalledWith(2)
})
