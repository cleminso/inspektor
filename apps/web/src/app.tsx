import '@fontsource-variable/geist-mono/wght.css'
import '@fontsource-variable/geist/wght.css'

import './index.css'

// import { Agentation } from 'agentation'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { ThemeProvider } from 'next-themes'
// The app shell only needs Tooltip. Its focused public export avoids importing through the broad
// design-system barrel at this application-wide boundary.
import { Tooltip } from '@inspector/ds/tooltip'

import { routeTree } from './routeTree.gen'
import { ThemeMetadata } from './app/themeMetadata'
import { reportCaughtReactError } from './app/runtime/runtimeError'
import ReactDOM from 'react-dom/client'

if (import.meta.env.DEV === true) {
  // StyleX source is compiled by Vite; its development runtime is only needed while developing.
  void import('virtual:stylex:runtime')
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement, { onCaughtError: reportCaughtReactError }).render(
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeMetadata />
      <Tooltip.Provider>
        <StrictMode>
          <RouterProvider router={router} />
          {/*{import.meta.env.DEV === true ? <Agentation endpoint="/agentation" /> : null}*/}
        </StrictMode>
      </Tooltip.Provider>
    </ThemeProvider>,
  )
}
