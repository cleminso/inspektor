import { useMemo, useState } from "react";

import {
  filterQuerySubscriptionRows,
  filterQuerySubscriptionTableNames,
} from "@/components/query-subscriptions/querySubscriptionFilters";
import { useQuerySubscriptionTelemetry } from "@/hooks/useQuerySubscriptionsTelemetry";
import type {
  QuerySubscriptionPropagation,
  QuerySubscriptionRow,
} from "@/types/querySubscriptions";

export interface UseQuerySubscriptionsStateResult {
  error: string | null;
  filteredRows: QuerySubscriptionRow[];
  generatedAt: number | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  listSearchValue: string;
  rows: QuerySubscriptionRow[];
  selectedPropagations: QuerySubscriptionPropagation[];
  selectedTableName: string | null;
  setPropagationSelected: (propagation: QuerySubscriptionPropagation, selected: boolean) => void;
  setListSearchValue: (value: string) => void;
  setSelectedTableName: (value: string | null) => void;
  tableCount: number;
  visibleTableNames: string[];
}

export function useQuerySubscriptionsState(tables: string[]): UseQuerySubscriptionsStateResult {
  const telemetry = useQuerySubscriptionTelemetry();
  const [listSearchValue, setListSearchValue] = useState("");
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [selectedPropagations, setSelectedPropagations] = useState<QuerySubscriptionPropagation[]>(
    [],
  );
  const visibleTableNames = useMemo(
    () => filterQuerySubscriptionTableNames(tables, listSearchValue),
    [listSearchValue, tables],
  );

  const effectiveSelectedTableName = useMemo(() => {
    if (selectedTableName === null) {
      return null;
    }

    const selectedTableExists = tables.includes(selectedTableName);
    return selectedTableExists === true ? selectedTableName : null;
  }, [selectedTableName, tables]);

  const filteredRows = useMemo(
    () =>
      filterQuerySubscriptionRows(telemetry.rows, {
        selectedPropagations,
        selectedTableName: effectiveSelectedTableName,
      }),
    [effectiveSelectedTableName, selectedPropagations, telemetry.rows],
  );

  const setPropagationSelected = (propagation: QuerySubscriptionPropagation, selected: boolean) => {
    setSelectedPropagations((currentPropagations) => {
      if (selected === true) {
        return currentPropagations.includes(propagation)
          ? currentPropagations
          : [...currentPropagations, propagation];
      }

      return currentPropagations.filter((currentPropagation) => currentPropagation !== propagation);
    });
  };

  return {
    rows: telemetry.rows,
    filteredRows,
    visibleTableNames,
    tableCount: tables.length,
    generatedAt: telemetry.generatedAt,
    error: telemetry.error,
    isInitialLoading: telemetry.isInitialLoading,
    isRefreshing: telemetry.isRefreshing,
    listSearchValue,
    selectedPropagations,
    selectedTableName: effectiveSelectedTableName,
    setPropagationSelected,
    setListSearchValue,
    setSelectedTableName,
  };
}
