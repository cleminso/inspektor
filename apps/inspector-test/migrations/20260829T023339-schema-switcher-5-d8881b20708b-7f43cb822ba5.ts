import { schema as s } from "jazz-tools";

export default s.defineMigration({
  migrate: {
    "emptyRecords": {
      "migrationMarkerFive": s.add.string({ default: null }),
    },
  },
  fromHash: "d8881b20708b",
  toHash: "7f43cb822ba5",
  from: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
    "migrationMarkerThree": s.string().optional(),
    "migrationMarkerFour": s.string().optional(),
  })
},
  to: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
    "migrationMarkerTwo": s.string().optional(),
    "migrationMarkerThree": s.string().optional(),
    "migrationMarkerFour": s.string().optional(),
    "migrationMarkerFive": s.string().optional(),
  })
},
});
