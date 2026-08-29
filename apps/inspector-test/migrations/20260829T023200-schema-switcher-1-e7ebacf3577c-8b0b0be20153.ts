import { schema as s } from "jazz-tools";

export default s.defineMigration({
  createTables: {
    "paginationRecords": true,
  },
  migrate: {
    "emptyRecords": {
      "migrationMarkerOne": s.add.string({ default: null }),
    },
  },
  fromHash: "e7ebacf3577c",
  toHash: "8b0b0be20153",
  from: {
  "emptyRecords": s.table({
    "label": s.string(),
  })
},
  to: {
  "emptyRecords": s.table({
    "label": s.string(),
    "migrationMarkerOne": s.string().optional(),
  }),
  "paginationRecords": s.table({
    "label": s.string(),
  })
},
});
