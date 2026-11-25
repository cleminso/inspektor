import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@inspektor/ds'

import { ConnectionProvider } from '@app/connections/connectionProvider'
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
        <ConnectionProvider>
          <Outlet />
          <Toaster />
          <InspectorDevtools />
        </ConnectionProvider>
      </AppHotkeysProvider>
    </>
  )
}
