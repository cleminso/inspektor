## Regarde Inspector

Alternative inspector to the official [Jazz-tools Inspector](https://jazz2-inspector.vercel.app).

A 2-weeks challenge to build an inspector with my UX and product vision.

**Scopes**:

- Focus on usability and UX
- Functionality parity with the official inspector
- Setup a package UI design system that can be reused across different products

**Out of scope**:

- Support other framework then React
- Extend the official inspector capabilities (only use existing APIs)
- "Pixel-perfect" UI design

## Option 1 - Manual connection

1. Clone the repository:
   `git clone git@github.com:regardedev/inspector.git`
   `cd inspector`

2. Install dependencies:
   `pnpm install`

3. Build the workspace packages:
   `pnpm build`

4. Start the inspector:
   `pnpm dev:web`

5. Open in browser:
   `http://regarde.inspector.localhost:1355/conn`

The default dev command runs Portless with an unprivileged HTTP proxy on port `1355`, so it does not require `sudo`. If you want to run Vite without the named local URL, use:

`pnpm --filter regarde.inspector dev:vite`

Then open `http://localhost:5173/conn`.

Agentation is enabled in development and syncs annotations with the local MCP server at `http://localhost:4747`.

## Option 2: add your Jazz app inside this workspace

You can also clone your Jazz app into the `apps/` directory. Or see `apps/my-jazz-app` example.

1. Add the local dev tools package to your app dependencies:
   `"@regarde/jazz-dev-tools@workspace:*"`

2. Update your app's Vite config:

   ```ts
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import { jazzInspectorPlugin } from "@regarde/jazz-dev-tools";

   export default defineConfig({
     plugins: [react(), jazzInspectorPlugin()],
   });
   ```

   The Regarde plugin wraps the Jazz local dev runtime and prints a local inspector URL with the app credentials in the URL hash. This is only meant for local development.

3. Build the workspace once:
   `pnpm build`

4. Start the inspector in one terminal:
   `pnpm dev:web`

5. Start your Jazz app in another terminal:
   `cd apps/{your_app_name}`
   `pnpm dev`

6. Open the inspector link printed in your app's dev server logs.

## Explication

### UX questions & improvements

I consider the current version as an MVP. There is severals missing pattern and to UI polish.

Next:

[ ] add a filter view inside `tableListPane` as a tree system. Users can apply filter tables and "save" several filtered view, while leaving the original view intact

[ ] think about the UX for relations tables <> tables (custom cell + UX with view? navigation?)

[ ] add a proper textarea component to support code syntax highlighting and formatting

[ ] add hotkeys
