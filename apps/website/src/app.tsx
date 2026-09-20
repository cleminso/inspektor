import './fonts.css'
import './index.css'

import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { ThemeProvider } from 'next-themes'
import ReactDOM from 'react-dom/client'

import { ThemeMetadata } from './app/themeMetadata'
import { routeTree } from './routeTree.gen'

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

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
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="theme"
      >
        <ThemeMetadata />
        <RouterProvider router={router} />
      </ThemeProvider>
    </StrictMode>,
  )
}
