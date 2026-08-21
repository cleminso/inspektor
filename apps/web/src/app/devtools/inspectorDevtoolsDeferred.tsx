import { TanStackDevtools } from '@tanstack/react-devtools'
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

const plugins = [
  hotkeysDevtoolsPlugin(),
  {
    id: 'tanstack-router',
    name: 'TanStack Router',
    render: <TanStackRouterDevtoolsPanel />,
  },
]

export function InspectorDevtoolsDeferred(): React.ReactElement {
  return <TanStackDevtools plugins={plugins} />
}
