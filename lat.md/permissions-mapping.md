# Jazz permissions mapping

Jazz authoring rules compile into operation-specific slots and expression trees. Inspektor can present those structures without predicting whether a mutation will succeed.

## Table of contents

This page maps Jazz permission authoring APIs to compiled permissions and safe Inspektor output.

- [References](#references)
- [Permission matrix](#permission-matrix)
- [Authoring matrix](#authoring-matrix)
- [Compiled slots matrix](#compiled-slots-matrix)
- [Hierarchy](#hierarchy)
- [Shortcuts](#shortcuts)
- [Authoring condition families](#authoring-condition-families)
- [Compiled expression matrix](#compiled-expression-matrix)
- [Inspektor mapping](#inspektor-mapping)
- [Safe Inspektor outputs](#safe-inspektor-outputs)

## References

The Jazz permissions source and documentation define the authoring and compiled forms.

- [Jazz permissions source](https://github.com/garden-co/jazz/blob/main/packages/jazz-tools/src/permissions/index.ts)
- [Jazz environment permissions documentation](https://jazz.tools/docs/auth/permissions#jazz-environment-typescript)

## Permission matrix

Each operation has an authoring entry point and compiles into `using`, `with_check`, or both slots.

| Operation | Authoring entrypoint | Authoring methods                                                      | Compiled slots         | Typical meaning                                                                 |
| --------- | -------------------- | ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| Read      | `allowRead`          | `.always()` `.never()` `.where(...)`                                   | `using`                | Which existing rows can be read                                                 |
| Insert    | `allowInsert`        | `.always()` `.never()` `.where(...)`                                   | `with_check`           | Which new rows may be inserted                                                  |
| Update    | `allowUpdate`        | `.always()` `.never()` `.where(...)` `.whereOld(...)` `.whereNew(...)` | `using` + `with_check` | Which existing rows may be updated, and what the updated row must still satisfy |
| Delete    | `allowDelete`        | `.always()` `.never()` `.where(...)`                                   | `using`                | Which existing rows may be deleted                                              |

## Authoring matrix

All operation builders support unconditional and conditional rules. Only updates distinguish old-row and new-row conditions.

| Operation     | `.always()` | `.never()` | `.where(...)` | `.whereOld(...)` | `.whereNew(...)` |
| ------------- | ----------- | ---------- | ------------- | ---------------- | ---------------- |
| `allowRead`   | yes         | yes        | yes           | no               | no               |
| `allowInsert` | yes         | yes        | yes           | no               | no               |
| `allowUpdate` | yes         | yes        | yes           | yes              | yes              |
| `allowDelete` | yes         | yes        | yes           | no               | no               |

## Compiled slots matrix

The `using` slot checks an existing row. The `with_check` slot checks a new or updated row.

| Operation | `using` | `with_check` | Notes                                                               |
| --------- | ------- | ------------ | ------------------------------------------------------------------- |
| `select`  | yes     | no           | `using` gates which existing rows are visible                       |
| `insert`  | no      | yes          | `with_check` validates the new row                                  |
| `update`  | yes     | yes          | `using` checks the current row, `with_check` checks the updated row |
| `delete`  | yes     | no           | `using` gates which existing rows may be removed                    |

## Hierarchy

Compiled permissions nest operations, slots, and expression trees beneath each table.

| Level           | Shape                                                      |
| --------------- | ---------------------------------------------------------- |
| table           | one table has four operations                              |
| operation       | `Read`, `Insert`, `Update`, `Delete`                       |
| compiled slot   | `using`, `with_check`, or both                             |
| expression tree | `True`, comparisons, inheritance, existence, boolean logic |

## Shortcuts

Jazz provides a helper for the common creator-owned row policy.

| Shortcut             | Meaning                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `managedByCreator()` | Convenience helper for creator-owned row policies across read, insert, update, and delete |

## Authoring condition families

Authoring rules can compare columns or sessions, compose logic, inherit access, and test for related rows.

| Family               | Examples                                                  |
| -------------------- | --------------------------------------------------------- |
| direct column checks | `{ owner_id: session.user_id }`                           |
| logical composition  | `allOf(...)`, `anyOf(...)`                                |
| session checks       | `session.where({ "claims.role": "manager" })`             |
| inherited access     | `allowedTo.read("project")`, `allowedTo.update("parent")` |
| existence checks     | `policy.todoShares.exists.where(...)`                     |

## Compiled expression matrix

Compiled expressions encode literals, comparisons, membership, existence, inheritance, and boolean composition.

| Compiled node         | Meaning                                          |
| --------------------- | ------------------------------------------------ |
| `True`                | always allowed                                   |
| `False`               | never allowed                                    |
| `Cmp`                 | compare a column to a value                      |
| `SessionCmp`          | compare session data to a literal value          |
| `IsNull`              | column is null                                   |
| `IsNotNull`           | column is not null                               |
| `SessionIsNull`       | session path is null                             |
| `SessionIsNotNull`    | session path is not null                         |
| `Contains`            | column contains a value                          |
| `SessionContains`     | session value contains a literal                 |
| `In`                  | column value exists in a session path            |
| `InList`              | column value exists in a list of values          |
| `SessionInList`       | session value exists in a list of literal values |
| `Exists`              | matching row exists in another table             |
| `ExistsRel`           | matching related row exists                      |
| `Inherits`            | inherit permission through a referenced row      |
| `InheritsReferencing` | inherit permission from referencing rows         |
| `And`                 | all child expressions must match                 |
| `Or`                  | any child expression may match                   |
| `Not`                 | negate a child expression                        |

## Inspektor mapping

Inspektor maps each user-facing operation question to the corresponding compiled slot.

| Question                       | Backed by                            |
| ------------------------------ | ------------------------------------ |
| can this table be read?        | `select.using`                       |
| can new rows be inserted?      | `insert.with_check`                  |
| can rows generally be updated? | `update.using` + `update.with_check` |
| can rows generally be deleted? | `delete.using`                       |

[[apps/web/src/app/runtime/useInspectorRuntime.tsx#useInspectorRuntime]] loads stored permissions with the selected schema. The historical [[lat.md/table-explorer#Table Explorer research#Stored schema and permissions APIs]] note records that runtime relationship.

## Safe Inspektor outputs

Inspektor can show operation status, compiled structure, rule details, and raw JSON as progressively deeper views.

| UI layer  | What to show                      |
| --------- | --------------------------------- |
| summary   | operation status                  |
| structure | `using` and `with_check` presence |
| detail    | compiled rule tree                |
| debug     | raw JSON                          |
