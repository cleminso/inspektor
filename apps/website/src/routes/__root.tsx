import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'

import { NotFoundPage } from '../pages/notFound/notFoundPage'

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: 'Inspektor | Inspect Jazz application data in your browser' }],
  }),
  notFoundComponent: NotFoundPage,
  component: RootComponent,
})

function RootComponent(): React.ReactElement {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  )
}
