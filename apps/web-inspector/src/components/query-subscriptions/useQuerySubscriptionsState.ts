import { useMemo, useState } from "react";

import { useQuerySubscriptionTelemetry } from "@/hooks/useQuerySubscriptionsTelemetry";
import type { QuerySubscriptionRow, QuerySubscriptionTableItem } from "@/types/QuerySubscriptions";

export interface UseQuerySubscriptionsStateResult {
  error: string | null;
  filteredRows: QuerySubscriptionRow[];
  generatedAt: number | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  listSearchValue: string;
  rows: QuerySubscriptionRow[];
  selectedTableName: string | null;
  setListSearchValue: (value: string) => void;
  setSelectedTableName: (value: string | null) => void;
  visibleTableItems: QuerySubscriptionTableItem[];
}

export function useQuerySubscriptionsState(): UseQuerySubscriptionsStateResult {
  const telemetry = useQuerySubscriptionTelemetry();
  const [listSearchValue, setListSearchValue] = useState("");
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);

  const tableItems = useMemo<QuerySubscriptionTableItem[]>(() => {
    const subscriptionCountByTable = new Map<string, number>();

    for (const row of telemetry.rows) {
      subscriptionCountByTable.set(row.table, (subscriptionCountByTable.get(row.table) ?? 0) + row.count);
    }

    return [...subscriptionCountByTable.entries()]
      .sort(([leftTableName], [rightTableName]) => leftTableName.localeCompare(rightTableName))
      .map(([tableName, subscriptionCount]) => ({ tableName, subscriptionCount }));
  }, [telemetry.rows]);

  const normalizedSearchValue = listSearchValue.trim().toLowerCase();
  const visibleTableItems = useMemo(() => {
    if (normalizedSearchValue.length === 0) {
      return tableItems;
    }

    return tableItems.filter((tableItem) => tableItem.tableName.toLowerCase().includes(normalizedSearchValue));
  }, [normalizedSearchValue, tableItems]);

  const effectiveSelectedTableName = useMemo(() => {
    if (selectedTableName === null) {
      return null;
    }

    const selectedTableExists = tableItems.some((tableItem) => tableItem.tableName === selectedTableName);
    return selectedTableExists === true ? selectedTableName : null;
  }, [selectedTableName, tableItems]);

  const filteredRows = useMemo(() => {
    return telemetry.rows.filter((row) => {
      if (effectiveSelectedTableName !== null && row.table !== effectiveSelectedTableName) {
        return false;
      }

      return true;
    });
  }, [effectiveSelectedTableName, telemetry.rows]);

  return {
    rows: telemetry.rows,
    filteredRows,
    visibleTableItems,
    generatedAt: telemetry.generatedAt,
    error: telemetry.error,
    isInitialLoading: telemetry.isInitialLoading,
    isRefreshing: telemetry.isRefreshing,
    listSearchValue,
    selectedTableName: effectiveSelectedTableName,
    setListSearchValue,
    setSelectedTableName,
  };
}
