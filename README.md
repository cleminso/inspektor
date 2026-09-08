# Inspektor

Inspektor is a browser-based inspector for Jazz applications. Use it at [inspektor.dev](https://inspektor.dev).

## Table of contents

- [Use Inspektor](#use-inspektor)
- [Credential storage](#credential-storage)
- [Local development](#local-development)
- [Project documentation](#project-documentation)

## Use Inspektor

Open [inspektor.dev](https://inspektor.dev), create a connection, and enter the Jazz server URL, app ID, admin secret, environment, and branch. Inspektor loads the published schema so you can inspect tables, rows, permissions, and live queries.

Inspektor follows the connection model used by the official [Jazz Inspector](https://jazz2-inspector.vercel.app).

## Credential storage

Connection profiles, including admin secrets, are stored in the browser's local storage. Credentials are used only with the configured Jazz server. Do not share browser profiles that contain saved connections.

## Local development

Install dependencies:

```sh
pnpm install
```

Start the web application:

```sh
pnpm dev:web
```

For an isolated Jazz application, run the fixture in another terminal:

```sh
pnpm inspektor-test:fixture
```

Use the direct HTTP Vite URL when connecting to the fixture. The fixture prints ephemeral credentials for local use and deletes its data when stopped. See [Inspektor Test](./apps/inspektor-test/README.md) for its scenarios and security rules.

Run browser acceptance tests against an isolated fixture:

```sh
pnpm test:browser
```

## Project documentation

- [Architecture](./ARCHITECTURE.md)
- [Knowledge graph](./lat.md/lat.md)
- [Frontend structure](./lat.md/frontendStructure.md)
- [Product design](./lat.md/design-document.md)
- [Implementation checklists](./todo/)
- [Specifications](./specs/)
- [Research](./research/)
