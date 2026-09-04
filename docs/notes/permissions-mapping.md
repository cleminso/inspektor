## References

`https://github.com/garden-co/jazz/packages/jazz-tools/src/permissions/index.ts`
`https://jazz.tools/docs/auth/permissions#jazz-environment-typescript`

## Permission Matrix

| Operation | Authoring entrypoint | Authoring methods                                                      | Compiled slots         | Typical meaning                                                                 |
| --------- | -------------------- | ---------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------- |
| Read      | `allowRead`          | `.always()` `.never()` `.where(...)`                                   | `using`                | Which existing rows can be read                                                 |
| Insert    | `allowInsert`        | `.always()` `.never()` `.where(...)`                                   | `with_check`           | Which new rows may be inserted                                                  |
| Update    | `allowUpdate`        | `.always()` `.never()` `.where(...)` `.whereOld(...)` `.whereNew(...)` | `using` + `with_check` | Which existing rows may be updated, and what the updated row must still satisfy |
| Delete    | `allowDelete`        | `.always()` `.never()` `.where(...)`                                   | `using`                | Which existing rows may be deleted                                              |

## Authoring Matrix

| Operation     | `.always()` | `.never()` | `.where(...)` | `.whereOld(...)` | `.whereNew(...)` |
| ------------- | ----------- | ---------- | ------------- | ---------------- | ---------------- |
| `allowRead`   | yes         | yes        | yes           | no               | no               |
| `allowInsert` | yes         | yes        | yes           | no               | no               |
| `allowUpdate` | yes         | yes        | yes           | yes              | yes              |
| `allowDelete` | yes         | yes        | yes           | no               | no               |

## Compiled Slots Matrix

| Operation | `using` | `with_check` | Notes                                                               |
| --------- | ------- | ------------ | ------------------------------------------------------------------- |
| `select`  | yes     | no           | `using` gates which existing rows are visible                       |
| `insert`  | no      | yes          | `with_check` validates the new row                                  |
| `update`  | yes     | yes          | `using` checks the current row, `with_check` checks the updated row |
| `delete`  | yes     | no           | `using` gates which existing rows may be removed                    |

## Hierarchy

| Level           | Shape                                                      |
| --------------- | ---------------------------------------------------------- |
| table           | one table has four operations                              |
| operation       | `Read`, `Insert`, `Update`, `Delete`                       |
| compiled slot   | `using` and/or `with_check`                                |
| expression tree | `True`, comparisons, inheritance, existence, boolean logic |

## Shortcuts

| Shortcut             | Meaning                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `managedByCreator()` | Convenience helper for creator-owned row policies across read, insert, update, and delete |

## Authoring Condition Families

| Family               | Examples                                                  |
| -------------------- | --------------------------------------------------------- |
| direct column checks | `{ owner_id: session.user_id }`                           |
| logical composition  | `allOf(...)`, `anyOf(...)`                                |
| session checks       | `session.where({ "claims.role": "manager" })`             |
| inherited access     | `allowedTo.read("project")`, `allowedTo.update("parent")` |
| existence checks     | `policy.todoShares.exists.where(...)`                     |

## Compiled Expression Matrix

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

## Inspektor Mapping

| Question                       | Backed by                            |
| ------------------------------ | ------------------------------------ |
| can this table be read?        | `select.using`                       |
| can new rows be inserted?      | `insert.with_check`                  |
| can rows generally be updated? | `update.using` + `update.with_check` |
| can rows generally be deleted? | `delete.using`                       |

## Safe Inspektor Outputs

| UI layer  | What to show                    |
| --------- | ------------------------------- |
| summary   | operation status                |
| structure | `using` / `with_check` presence |
| detail    | compiled rule tree              |
| debug     | raw JSON                        |
