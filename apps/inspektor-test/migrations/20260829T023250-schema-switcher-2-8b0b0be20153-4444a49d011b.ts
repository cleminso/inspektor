import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "emptyRecords": {
      "migrationMarkerTwo": s.add.string({ default: null }),
    },
  },
  fromHash: "8b0b0be20153",
  toHash: "4444a49d011b",
  from: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
  })
},
  to: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
  })
},
});
