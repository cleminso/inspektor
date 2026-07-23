import "./index.css";

import { Agentation } from "agentation";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { ThemeProvider } from "next-themes";
import { Tooltip } from "@inspector/ds";

import { routeTree } from "./routeTree.gen";
import ReactDOM from "react-dom/client";

if (import.meta.env.DEV === true) {
  void import("virtual:stylex:runtime");
}

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement !== null) {
  ReactDOM.createRoot(rootElement).render(
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Tooltip.Provider>
        <StrictMode>
          <RouterProvider router={router} />
          {import.meta.env.DEV === true ? <Agentation endpoint="http://localhost:4747" /> : null}
        </StrictMode>
      </Tooltip.Provider>
    </ThemeProvider>
  );
}
