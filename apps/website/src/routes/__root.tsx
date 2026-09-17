import { HeadContent, Outlet, createRootRoute } from '@tanstack/react-router'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: 'Inspektor Studio' },
      {
        name: 'description',
        content: 'Explore your Jazz application data locally in your browser.',
      },
    ],
  }),
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
