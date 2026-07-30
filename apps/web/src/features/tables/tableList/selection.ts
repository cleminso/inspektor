export interface UpdateTableNameSelectionOptions {
  anchorTableName: string | null;
  checked: boolean;
  checkedTableNames: ReadonlySet<string>;
  orderedTableNames: readonly string[];
  targetTableName: string;
}

export function updateTableNameSelection({
  anchorTableName,
  checked,
  checkedTableNames,
  orderedTableNames,
  targetTableName,
}: UpdateTableNameSelectionOptions): ReadonlySet<string> {
  const nextCheckedTableNames = new Set(checkedTableNames);
  const anchorIndex =
    anchorTableName === null ? -1 : orderedTableNames.indexOf(anchorTableName);
  const targetIndex = orderedTableNames.indexOf(targetTableName);
  const hasRange = anchorIndex >= 0 && targetIndex >= 0;
  const rangeTableNames =
    hasRange === true
      ? orderedTableNames.slice(
          Math.min(anchorIndex, targetIndex),
          Math.max(anchorIndex, targetIndex) + 1,
        )
      : [targetTableName];

  for (const tableName of rangeTableNames) {
    if (checked === true) {
      nextCheckedTableNames.add(tableName);
    } else {
      nextCheckedTableNames.delete(tableName);
    }
  }

  return nextCheckedTableNames;
}
