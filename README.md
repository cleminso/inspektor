# Inspektor

Inspektor is a browser-based inspector for Jazz applications. Use it at [inspektor.dev](https://inspektor.dev).

## Table of contents

- [Use Inspektor](#use-inspektor)
- [Credential storage](#credential-storage)
- [Local development](#local-development)
- [Validation](#validation)
- [Project documentation](#project-documentation)

## Use Inspektor

Open [inspektor.dev](https://inspektor.dev), create a connection, and enter the Jazz server URL, app ID, admin secret, environment, and branch. Inspektor loads the published schema so you can inspect tables, rows, permissions, and live queries.

Inspektor follows the connection model used by the official [Jazz Inspector](https://jazz2-inspector.vercel.app).

## Credential storage

Connection profiles and workspace preferences are stored in the browser's local storage, but admin secrets are not. By default, an admin secret remains in memory and must be entered again after a refresh. Each connection can instead remember its secret in the current tab session. Credentials are used only with the configured Jazz server.

## Local development

Install dependencies:

```sh
pnpm install
```

Start the Studio application:

```sh
pnpm dev:studio
```

For an isolated Jazz application, run the fixture in another terminal:

```sh
pnpm inspektor-test:fixture
```

Use the direct HTTP Vite URL when connecting to the fixture. The fixture prints ephemeral credentials for local use and deletes its data when stopped. See [Inspektor Test](./apps/inspektor-test/README.md) for its scenarios and security rules.

## Validation

Run the workspace Vitest suites:

```sh
pnpm test
```

Run standalone Playwright E2E tests against built applications:

```sh
pnpm test:e2e
```

Install the Playwright browser before its first local run with `pnpm test:e2e:install`. Run the complete lint, typecheck, test, and build gate with `pnpm check`. For a focused Vitest suite, use `pnpm --filter <package> test`.

## Project documentation

- [Architecture](./ARCHITECTURE.md)
- [Knowledge graph](./lat.md/lat.md)
- [Frontend structure](./lat.md/frontendStructure.md)
- [Product design](./lat.md/design-document.md)
- [Implementation checklists](./todo/)
- [Specifications](./specs/)
- [Research](./research/)
