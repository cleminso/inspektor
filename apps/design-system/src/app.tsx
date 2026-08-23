import '@fontsource-variable/geist-mono/wght.css'
import '@fontsource-variable/geist/wght.css'

import './index.css'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Tooltip } from '@inspector/ds'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'

import { ThemeProvider } from '@/components/themeProvider'

import { routeTree } from './routeTree.gen'

if (import.meta.env.DEV === true) {
  void import('virtual:stylex:runtime')
}

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <Tooltip.Provider>
          <RouterProvider router={router} />
        </Tooltip.Provider>
      </ThemeProvider>
    </StrictMode>,
  )
}
