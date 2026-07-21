import type {
  QuerySubscriptionPropagation,
  QuerySubscriptionRow,
} from "@/types/querySubscriptions";

export function filterQuerySubscriptionTableNames(
  tableNames: string[],
  searchValue: string,
): string[] {
  const normalizedSearchValue = searchValue.trim().toLowerCase();

  if (normalizedSearchValue.length === 0) {
    return tableNames;
  }

  return tableNames.filter((tableName) => tableName.toLowerCase().includes(normalizedSearchValue));
}

interface QuerySubscriptionFilters {
  selectedPropagations: QuerySubscriptionPropagation[];
  selectedTableName: string | null;
}

export function filterQuerySubscriptionRows(
  rows: QuerySubscriptionRow[],
  filters: QuerySubscriptionFilters,
): QuerySubscriptionRow[] {
  const selectedPropagations = new Set<string>(filters.selectedPropagations);

  return rows.filter((row) => {
    if (filters.selectedTableName !== null && row.table !== filters.selectedTableName) {
      return false;
    }

    if (selectedPropagations.size > 0 && selectedPropagations.has(row.propagation) === false) {
      return false;
    }

    return true;
  });
}
