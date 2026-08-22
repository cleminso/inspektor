import type { JsonValue } from "jazz-tools";

const activeTimestamp = new Date("2024-02-29T12:34:56.789Z");
const archivedTimestamp = new Date("1999-12-31T23:59:59.999Z");
const populatedColumnJson: JsonValue = {
  nested: { enabled: true },
  tags: ["inspector-test", "populated"],
};
const emptyColumnJson: JsonValue = { emptyArray: [], emptyObject: {}, nullable: null };
const populatedOptionalJson: JsonValue = { status: "present" };
const populatedWideJson: JsonValue = { width: "many columns" };
const emptyJson: JsonValue = {};
const longText = Array.from(
  { length: 40 },
  (_, index) => `Segment ${String(index + 1).padStart(2, "0")}: Inspector content remains readable across long values.`,
).join(" ");

export const inspectorTestIds = {
  project: "10000000-0000-4000-8000-000000000001",
  relationParentPrimary: "20000000-0000-4000-8000-000000000001",
  relationParentSecondary: "20000000-0000-4000-8000-000000000002",
} as const;

export const inspectorTestRows = {
  projects: [
    {
      id: inspectorTestIds.project,
      name: "Inspector Test",
    },
  ],
  columnTypeShowcase: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      label: "Optional values populated",
      textValue: "Plain text",
      booleanValue: true,
      integerValue: 42,
      floatValue: 3.14159,
      timestampValue: activeTimestamp,
      enumValue: "active" as const,
      jsonValue: populatedColumnJson,
      stringArrayValue: ["alpha", "beta", "gamma"],
      bytesValue: new Uint8Array([0, 1, 2, 127, 254, 255]),
      optionalTextValue: "Present optional text",
      optionalBooleanValue: false,
      optionalEnumValue: "draft" as const,
      optionalJsonValue: populatedOptionalJson,
      projectId: inspectorTestIds.project,
    },
    {
      id: "30000000-0000-4000-8000-000000000002",
      label: "Optional values null",
      textValue: "Required values remain present",
      booleanValue: false,
      integerValue: -2_147_483_648,
      floatValue: -0.000_001,
      timestampValue: archivedTimestamp,
      enumValue: "archived" as const,
      jsonValue: emptyColumnJson,
      stringArrayValue: [],
      bytesValue: null,
      optionalTextValue: null,
      optionalBooleanValue: null,
      optionalEnumValue: null,
      optionalJsonValue: null,
      projectId: null,
    },
  ],
  contentEdgeCases: [
    {
      id: "40000000-0000-4000-8000-000000000001",
      caseName: "Text rendering boundaries",
      emptyText: "",
      whitespaceText: "  leading, repeated, and trailing whitespace  ",
      longText,
      multilineText: "First line\nSecond line\n\nFourth line after an empty line",
      unicodeText: "Café · naïve · 東京 · 👩🏽‍💻 · e\u0301",
      rightToLeftText: "English before مرحبا بالعالم English after",
      integerValue: 2_147_483_647,
      floatValue: 1.797_693_134_862_315_7e308,
      timestampValue: activeTimestamp,
      jsonValue: {
        deeply: { nested: { object: { with: { a: { visible: "leaf" } } } } },
        mixed: [true, false, null, 0, "text", { key: "value" }],
      },
      bytesValue: new Uint8Array(Array.from({ length: 64 }, (_, index) => index)),
    },
  ],
  creatorManagedRecords: [
    {
      id: "45000000-0000-4000-8000-000000000001",
      label: "Creator-managed record",
      notes: "The creator can read and mutate this row.",
    },
  ],
  publicEditableRecords: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      label: "Publicly editable",
      enabled: true,
    },
  ],
  publicReadOnlyRecords: [
    {
      id: "60000000-0000-4000-8000-000000000001",
      label: "Publicly readable",
      notes: "Mutations are denied by policy.",
    },
  ],
  relationParents: [
    {
      id: inspectorTestIds.relationParentPrimary,
      label: "Primary parent",
    },
    {
      id: inspectorTestIds.relationParentSecondary,
      label: "Secondary parent",
    },
  ],
  relationChildren: [
    {
      id: "70000000-0000-4000-8000-000000000001",
      label: "Required and optional relations populated",
      requiredParentId: inspectorTestIds.relationParentPrimary,
      optionalParentId: inspectorTestIds.relationParentSecondary,
    },
    {
      id: "70000000-0000-4000-8000-000000000002",
      label: "Optional relation null",
      requiredParentId: inspectorTestIds.relationParentPrimary,
      optionalParentId: null,
    },
  ],
  wideRecords: [
    {
      id: "80000000-0000-4000-8000-000000000001",
      recordName: "Optional values populated",
      requiredText: "Required text",
      optionalText: "Optional text",
      requiredBoolean: true,
      optionalBoolean: false,
      requiredInteger: 42,
      optionalInteger: -42,
      requiredFloat: 3.14159,
      optionalFloat: -3.14159,
      requiredTimestamp: activeTimestamp,
      optionalTimestamp: archivedTimestamp,
      requiredEnum: "active" as const,
      optionalEnum: "draft" as const,
      requiredJson: populatedWideJson,
      optionalJson: { present: true },
      requiredBytes: new Uint8Array([16, 32, 48, 64]),
      optionalBytes: new Uint8Array([255, 0, 255]),
      requiredStringArray: ["required", "array"],
      optionalStringArray: ["optional", "array"],
      shortHeaderWithLongContent: longText,
      deliberatelyLongColumnNameForHeaderOverflow: "Short value",
      anotherDeliberatelyLongColumnNameForHorizontalNavigation: "Another short value",
      relationParentId: inspectorTestIds.relationParentPrimary,
      optionalRelationParentId: inspectorTestIds.relationParentSecondary,
    },
    {
      id: "80000000-0000-4000-8000-000000000002",
      recordName: "Optional values null",
      requiredText: "Required text",
      optionalText: null,
      requiredBoolean: false,
      optionalBoolean: null,
      requiredInteger: 0,
      optionalInteger: null,
      requiredFloat: 0,
      optionalFloat: null,
      requiredTimestamp: archivedTimestamp,
      optionalTimestamp: null,
      requiredEnum: "archived" as const,
      optionalEnum: null,
      requiredJson: emptyJson,
      optionalJson: null,
      requiredBytes: new Uint8Array(),
      optionalBytes: null,
      requiredStringArray: [],
      optionalStringArray: null,
      shortHeaderWithLongContent: "Short content",
      deliberatelyLongColumnNameForHeaderOverflow: "Value",
      anotherDeliberatelyLongColumnNameForHorizontalNavigation: "Value",
      relationParentId: inspectorTestIds.relationParentPrimary,
      optionalRelationParentId: null,
    },
  ],
};
