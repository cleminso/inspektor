import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "emptyRecords": {
      "migrationMarkerFour": s.add.string({ default: null }),
    },
  },
  fromHash: "69c962a1a907",
  toHash: "d8881b20708b",
  from: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
    "migrationMarkerThree": s.string().optional(),
  })
},
  to: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
    "migrationMarkerThree": s.string().optional(),
    "migrationMarkerFour": s.string().optional(),
  })
},
});
