import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@inspector/ds'

import { InspectorSessionProvider } from '@app/providers/inspectorSessionProvider'
import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { InspectorDevtools } from '@app/devtools/inspectorDevtools'

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
      <AppHotkeysProvider>
        <InspectorSessionProvider>
          <Outlet />
          <Toaster />
          <InspectorDevtools />
        </InspectorSessionProvider>
      </AppHotkeysProvider>
    </>
  )
}
