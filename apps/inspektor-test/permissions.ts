import { schema as s } from "jazz-tools";

import { app } from "./schema.js";

export default s.definePermissions(app, ({ policy }) => {
  policy.projects.allowRead.always();
  policy.projects.allowInsert.always();
  policy.projects.allowUpdate.always();
  policy.projects.allowDelete.always();

  policy.columnTypeShowcase.allowRead.always();
  policy.columnTypeShowcase.allowInsert.always();
  policy.columnTypeShowcase.allowUpdate.never();
  policy.columnTypeShowcase.allowDelete.never();

  policy.contentEdgeCases.allowRead.always();
  policy.contentEdgeCases.allowInsert.never();
  policy.contentEdgeCases.allowUpdate.never();
  policy.contentEdgeCases.allowDelete.never();

  // Backend admission does not create author identity; retain this table as a creator-policy fixture.
  policy.creatorManagedRecords.managedByCreator();

  policy.emptyRecords.allowRead.always();
  policy.emptyRecords.allowInsert.always();
  policy.emptyRecords.allowUpdate.always();
  policy.emptyRecords.allowDelete.always();

  policy.paginationRecords.allowRead.always();
  policy.paginationRecords.allowInsert.never();
  policy.paginationRecords.allowUpdate.never();
  policy.paginationRecords.allowDelete.never();

  policy.publicEditableRecords.allowRead.always();
  policy.publicEditableRecords.allowInsert.always();
  policy.publicEditableRecords.allowUpdate.always();
  policy.publicEditableRecords.allowDelete.always();

  policy.publicReadOnlyRecords.allowRead.always();
  policy.publicReadOnlyRecords.allowInsert.never();
  policy.publicReadOnlyRecords.allowUpdate.never();
  policy.publicReadOnlyRecords.allowDelete.never();

  policy.relationParents.allowRead.always();
  policy.relationParents.allowInsert.always();
  policy.relationParents.allowUpdate.always();
  policy.relationParents.allowDelete.always();

  policy.relationChildren.allowRead.always();
  policy.relationChildren.allowInsert.always();
  policy.relationChildren.allowUpdate.always();
  policy.relationChildren.allowDelete.always();

  policy.todos.allowRead.always();
  policy.todos.allowInsert.always();
  policy.todos.allowUpdate.whereOld({ done: false }).whereNew({ done: false });
  policy.todos.allowDelete.where({ done: false });

  policy.wideRecords.allowRead.always();
  policy.wideRecords.allowInsert.never();
  policy.wideRecords.allowUpdate.never();
  policy.wideRecords.allowDelete.never();

  policy.uiPerformanceRecords.allowRead.always();
  policy.uiPerformanceRecords.allowInsert.always();
  policy.uiPerformanceRecords.allowUpdate.always();
  policy.uiPerformanceRecords.allowDelete.always();
});
