import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "emptyRecords": {
      "migrationMarkerThree": s.add.string({ default: null }),
    },
  },
  fromHash: "4444a49d011b",
  toHash: "69c962a1a907",
  from: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
  })
},
  to: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
    "migrationMarkerThree": s.string().optional(),
  })
},
});
