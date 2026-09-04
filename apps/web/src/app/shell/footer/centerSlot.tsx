import { createContext, use, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface InspectorFooterCenterContextValue {
  setTarget: (target: HTMLDivElement | null) => void
  target: HTMLDivElement | null
}

const InspectorFooterCenterContext = createContext<InspectorFooterCenterContextValue | null>(null)

export function InspectorFooterCenterProvider({
  children,
}: {
  children: ReactNode
}): React.ReactElement {
  const [target, setTarget] = useState<HTMLDivElement | null>(null)

  return (
    <InspectorFooterCenterContext value={{ setTarget, target }}>
      {children}
    </InspectorFooterCenterContext>
  )
}

export function InspectorFooterCenterSlot(): React.ReactElement {
  const context = use(InspectorFooterCenterContext)
  return (
    <div
      ref={context?.setTarget}
      data-slot="inspektor-footer-center"
    />
  )
}

export function InspectorFooterCenterPortal({
  children,
}: {
  children: ReactNode
}): React.ReactPortal | null {
  const context = use(InspectorFooterCenterContext)
  if (context === null) {
    throw new Error('InspectorFooterCenterPortal must be used within InspectorFooterCenterProvider')
  }
  return context.target === null ? null : createPortal(children, context.target)
}
