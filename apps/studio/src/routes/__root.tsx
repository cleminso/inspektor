import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@inspektor/ds'

import { InspectorSessionProvider } from '@app/providers/inspectorSessionProvider'
import { AppHotkeysProvider } from '@app/hotkeys/appHotkeys'
import { InspectorDevtools } from '@app/devtools/inspectorDevtools'
import { studioDocumentTitle } from '@shared/documentTitle'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: studioDocumentTitle }],
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
