import { schema as s } from "jazz-tools";

const schema = {
  projects: s.table(
    {
      name: s.string(),
    },
    {
      columnTypeShowcaseViaProject: s.reverse("columnTypeShowcase", "project"),
      todosViaProject: s.reverse("todos", "project"),
    },
  ),
  columnTypeShowcase: s.table(
    {
      label: s.string(),
      textValue: s.string(),
      booleanValue: s.boolean(),
      integerValue: s.int(),
      floatValue: s.float(),
      timestampValue: s.timestamp(),
      enumValue: s.enum("draft", "active", "archived"),
      jsonValue: s.json(),
      stringArrayValue: s.array(s.string()),
      bytesValue: s.bytes().optional(),
      optionalTextValue: s.string().optional(),
      optionalBooleanValue: s.boolean().optional(),
      optionalEnumValue: s.enum("draft", "active", "archived").optional(),
      optionalJsonValue: s.json().optional(),
      projectId: s.uuid().optional(),
    },
    {
      project: s.rel("projects", "projectId"),
    },
  ),
  contentEdgeCases: s.table(
    {
      caseName: s.string(),
      emptyText: s.string(),
      whitespaceText: s.string(),
      longText: s.string(),
      multilineText: s.string(),
      unicodeText: s.string(),
      rightToLeftText: s.string(),
      integerValue: s.int(),
      floatValue: s.float(),
      timestampValue: s.timestamp(),
      jsonValue: s.json(),
      bytesValue: s.bytes(),
    },
    {},
  ),
  creatorManagedRecords: s.table(
    {
      label: s.string(),
      notes: s.string().optional(),
    },
    {},
  ),
  emptyRecords: s.table(
    {
      label: s.string(),
      migrationMarkerOne: s.string().optional(),
      migrationMarkerTwo: s.string().optional(),
      migrationMarkerThree: s.string().optional(),
      migrationMarkerFour: s.string().optional(),
      migrationMarkerFive: s.string().optional(),
    },
    {},
  ),
  paginationRecords: s.table(
    {
      label: s.string(),
    },
    {},
  ),
  publicEditableRecords: s.table(
    {
      label: s.string(),
      enabled: s.boolean(),
    },
    {},
  ),
  publicReadOnlyRecords: s.table(
    {
      label: s.string(),
      notes: s.string().optional(),
    },
    {},
  ),
  relationParents: s.table(
    {
      label: s.string(),
    },
    {
      relationChildrenViaRequiredParent: s.reverse("relationChildren", "requiredParent"),
      relationChildrenViaOptionalParent: s.reverse("relationChildren", "optionalParent"),
      wideRecordsViaRelationParent: s.reverse("wideRecords", "relationParent"),
      wideRecordsViaOptionalRelationParent: s.reverse("wideRecords", "optionalRelationParent"),
    },
  ),
  relationChildren: s.table(
    {
      label: s.string(),
      requiredParentId: s.uuid(),
      optionalParentId: s.uuid().optional(),
    },
    {
      requiredParent: s.rel("relationParents", "requiredParentId"),
      optionalParent: s.rel("relationParents", "optionalParentId"),
    },
  ),
  todos: s.table(
    {
      title: s.string(),
      done: s.boolean(),
      description: s.string().optional(),
      parentId: s.uuid().optional(),
      projectId: s.uuid().optional(),
    },
    {
      parent: s.rel("todos", "parentId"),
      project: s.rel("projects", "projectId"),
      todosViaParent: s.reverse("todos", "parent"),
    },
  ),
  wideRecords: s.table(
    {
      recordName: s.string(),
      requiredText: s.string(),
      optionalText: s.string().optional(),
      requiredBoolean: s.boolean(),
      optionalBoolean: s.boolean().optional(),
      requiredInteger: s.int(),
      optionalInteger: s.int().optional(),
      requiredFloat: s.float(),
      optionalFloat: s.float().optional(),
      requiredTimestamp: s.timestamp(),
      optionalTimestamp: s.timestamp().optional(),
      requiredEnum: s.enum("draft", "active", "archived"),
      optionalEnum: s.enum("draft", "active", "archived").optional(),
      requiredJson: s.json(),
      optionalJson: s.json().optional(),
      requiredBytes: s.bytes(),
      optionalBytes: s.bytes().optional(),
      requiredStringArray: s.array(s.string()),
      optionalStringArray: s.array(s.string()).optional(),
      shortHeaderWithLongContent: s.string(),
      deliberatelyLongColumnNameForHeaderOverflow: s.string(),
      anotherDeliberatelyLongColumnNameForHorizontalNavigation: s.string(),
      relationParentId: s.uuid(),
      optionalRelationParentId: s.uuid().optional(),
    },
    {
      relationParent: s.rel("relationParents", "relationParentId"),
      optionalRelationParent: s.rel("relationParents", "optionalRelationParentId"),
    },
  ),
};

type AppSchema = s.Schema<typeof schema>;
export const app: s.App<AppSchema> = s.defineApp(schema);
