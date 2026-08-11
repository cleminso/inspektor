import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@inspector/ds'

import { InspectorSessionProvider } from '@app/providers/inspectorSessionProvider'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: 'Inspector' }],
  }),
  component: RootComponent,
})

function RootComponent(): React.ReactElement {
  return (
    <>
      <HeadContent />
      <InspectorSessionProvider>
        <Outlet />
        <Toaster />
      </InspectorSessionProvider>
    </>
  )
}
