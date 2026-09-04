## Regarde Inspector

Alternative inspektor to the official [Jazz-tools Inspector](https://jazz2-inspektor.vercel.app).

A 2-weeks challenge to build an inspektor with my UX and product vision.

**Scopes**:

- Focus on usability and UX
- Functionality parity with the official inspektor
- Setup a package UI design system that can be reused across different products

**Out of scope**:

- Support other framework then React
- Extend the official inspektor capabilities (only use existing APIs)
- "Pixel-perfect" UI design

## Option 1 - Manual connection

1. Clone the repository:
   `git clone git@github.com:regardedev/inspektor.git`
   `cd inspektor`

2. Install dependencies:
   `pnpm install`

3. Build the workspace packages:
   `pnpm build`

4. Start the inspektor:
   `pnpm dev:web`

5. Open in browser:
   `https://inspektor.localhost:1355/conn`

The default dev command runs Portless with an unprivileged HTTPS proxy on port `1355`, so it does not require `sudo`. If the local certificate is not trusted yet, run `pnpm --filter inspektor exec portless trust`. If you want to run Vite without the named local URL, use:

`pnpm --filter inspektor dev:vite`

Then open `http://localhost:5173/conn`.

Agentation is enabled in development and syncs annotations with the local MCP server at `http://localhost:4747`.

## Option 2: add your Jazz app inside this workspace

You can also clone your Jazz app into the `apps/` directory.

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

   The Regarde plugin wraps the Jazz local dev runtime and prints a local inspektor URL with the app credentials in the URL hash. This is only meant for local development.

3. Build the workspace once:
   `pnpm build`

4. Start the inspektor in one terminal:
   `pnpm dev:web`

5. Start your Jazz app in another terminal:
   `cd apps/{your_app_name}`
   `pnpm dev`

6. Open the inspektor link printed in your app's dev server logs.

## Project documentation

- [Architecture](./ARCHITECTURE.md)
- [Frontend structure](./docs/frontendStructure.md)
- [Implementation checklists](./docs/todo/)
