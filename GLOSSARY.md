# Inspektor glossary

Use these terms across code and documentation. The [contract views](lat.md/lat.md) own behavior and responsibility.

| Term                | Meaning                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Studio              | The Inspektor application for inspecting Jazz schema and data.                                      |
| Connection profile  | Saved server address, application identity, and connection settings.                                |
| Admin secret        | The credential used to access an inspected Jazz application.                                        |
| Branch label        | A local workspace label; not a Jazz server-side branch selector.                                    |
| Schema catalogue    | The ordered set of published schemas available to a connection.                                     |
| Schema hash         | The identity of a published schema version.                                                         |
| Runtime target      | The resolved connection, branch label, schema hash, and schema catalogue used to enter a workspace. |
| Workspace selection | The connection, local branch label, and schema accepted through committed route entry.              |
| Runtime session     | One scoped Jazz client acquisition, observation, and cleanup lifetime; core exposes `/session`.     |
| Runtime             | The connection-scoped Jazz client, metadata, permissions, and resource lifecycle.                   |
| Workspace           | The connected inspection UI for one runtime scope.                                                  |
| Table Explorer      | The schema-driven table and row inspection feature.                                                 |
| Row draft           | Local row-editor changes that have not been submitted.                                              |
| Mutation            | An insert, update, or delete submitted to Jazz.                                                     |
| Design system       | The reusable presentation and interaction package published as `@inspektor/ds`.                     |
