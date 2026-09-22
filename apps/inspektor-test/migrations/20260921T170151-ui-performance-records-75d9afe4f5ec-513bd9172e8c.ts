import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "uiPerformanceRecords": true,
  },
  fromHash: "75d9afe4f5ec",
  toHash: "513bd9172e8c",
  from: {},
  to: {
  "uiPerformanceRecords": s.table({
    "label": s.string(),
    "booleanValue": s.boolean(),
    "integerValue": s.int(),
    "bigIntValue": s.bigint(),
    "floatValue": s.float(),
    "timestampValue": s.timestamp(),
    "enumValue": s.enum("draft", "active", "archived"),
    "jsonValue": s.json(),
    "stringArrayValue": s.array(s.string()),
    "uuidValue": s.uuid(),
  }, {

  })
},
});
