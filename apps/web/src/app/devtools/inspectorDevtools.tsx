import { Suspense, lazy } from 'react'

const DeferredInspectorDevtools =
  import.meta.env.DEV === true
    ? lazy(async () => {
        const module = await import('./inspectorDevtoolsDeferred')

        return { default: module.InspectorDevtoolsDeferred }
      })
    : null

export function InspectorDevtools(): React.ReactElement | null {
  if (DeferredInspectorDevtools === null || import.meta.env.MODE === 'test') {
    return null
  }

  return (
    <Suspense fallback={null}>
      <DeferredInspectorDevtools />
    </Suspense>
  )
}
