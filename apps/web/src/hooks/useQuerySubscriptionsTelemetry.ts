/**
 * Polls Jazz server telemetry for active query subscriptions.
 *
 * This is server-side introspection, not local client state. The Inspector uses the active
 * admin connection to fetch grouped query subscriptions and renders them as debugging
 * context for which tables and queries the sync server is currently tracking.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchServerSubscriptions } from "jazz-tools";

import { useInspector } from "@/components/providers/inspectorProvider";
import type { QuerySubscriptionRow } from "@/types/QuerySubscriptions";

const LIVE_QUERY_POLL_MS = 20_000;

interface QuerySubscriptionsTelemetryCacheEntry {
  generatedAt: number | null;
  rows: QuerySubscriptionRow[];
}

// Module-level cache prevents empty flashes when navigating away from and back to telemetry.
const QuerySubscriptionsTelemetryCache = new Map<string, QuerySubscriptionsTelemetryCacheEntry>();

export interface useQuerySubscriptionTelemetryResult {
  error: string | null;
  generatedAt: number | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  rows: QuerySubscriptionRow[];
}

interface QuerySubscriptionsConnectionConfig {
  adminSecret: string;
  appId: string;
  connectionKey: string;
  serverUrl: string;
}

interface QuerySubscriptionsTelemetryState {
  error: string | null;
  generatedAt: number | null;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  rows: QuerySubscriptionRow[];
}

/**
 * Loads query subscription telemetry for the active Inspector connection.
 *
 * This reads the sync server's subscription list through the admin connection. Inspector
 * explorer queries are hidden elsewhere, so this hook shows the inspected app's activity
 * instead of the Inspector's own background reads.
 */
export function useQuerySubscriptionTelemetry(): useQuerySubscriptionTelemetryResult {
  const { activeConnection } = useInspector();
  const connectionConfig = useMemo<QuerySubscriptionsConnectionConfig | null>(() => {
    if (
      activeConnection === null ||
      activeConnection === undefined ||
      activeConnection.serverUrl === null ||
      activeConnection.serverUrl === undefined ||
      activeConnection.adminSecret === null ||
      activeConnection.adminSecret === undefined ||
      activeConnection.appId === null ||
      activeConnection.appId === undefined
    ) {
      return null;
    }

    return {
      connectionKey: `${activeConnection.id}:${activeConnection.serverUrl}:${activeConnection.appId}:${activeConnection.adminSecret}`,
      serverUrl: activeConnection.serverUrl,
      adminSecret: activeConnection.adminSecret,
      appId: activeConnection.appId,
    };
  }, [activeConnection]);
  const cachedTelemetry = useMemo(
    () => (connectionConfig !== null ? (QuerySubscriptionsTelemetryCache.get(connectionConfig.connectionKey) ?? null) : null),
    [connectionConfig],
  );
  // Prevent overlapping telemetry requests when a refresh is still resolving.
  const isFetchingRef = useRef(false);
  const [state, setState] = useState<QuerySubscriptionsTelemetryState>(() => ({
    rows: cachedTelemetry?.rows ?? [],
    generatedAt: cachedTelemetry?.generatedAt ?? null,
    error: connectionConfig === null ? "No connection selected." : null,
    isInitialLoading: connectionConfig !== null && cachedTelemetry === null,
    isRefreshing: false,
  }));

  useEffect(() => {
    // Polling can outlive a connection switch; ignore late responses for old connections.
    let cancelled = false;
    const isCancelled = () => cancelled;
    const nextCachedTelemetry =
      connectionConfig !== null ? (QuerySubscriptionsTelemetryCache.get(connectionConfig.connectionKey) ?? null) : null;

    if (connectionConfig === null) {
      setState({
        rows: [],
        generatedAt: null,
        error: "No connection selected.",
        isInitialLoading: false,
        isRefreshing: false,
      });
      return;
    }

    if (nextCachedTelemetry !== null) {
      // Reuse cached rows so the telemetry panel does not flash empty during navigation.
      setState({
        rows: nextCachedTelemetry.rows,
        generatedAt: nextCachedTelemetry.generatedAt,
        error: null,
        isInitialLoading: false,
        isRefreshing: false,
      });
    } else {
      setState({
        rows: [],
        generatedAt: null,
        error: null,
        isInitialLoading: true,
        isRefreshing: false,
      });
    }

    const load = async (mode: "initial" | "refresh") => {
      if (isCancelled() === true || isFetchingRef.current === true) {
        return;
      }

      isFetchingRef.current = true;

      setState((currentState) => ({
        ...currentState,
        isInitialLoading: mode === "initial" && currentState.rows.length === 0,
        isRefreshing: mode === "refresh" || currentState.rows.length > 0,
      }));

      try {
        const response = await fetchServerSubscriptions(connectionConfig.serverUrl, {
          adminSecret: connectionConfig.adminSecret,
          appId: connectionConfig.appId,
        });

        if (isCancelled() === true) {
          return;
        }

        QuerySubscriptionsTelemetryCache.set(connectionConfig.connectionKey, {
          rows: response.queries,
          generatedAt: response.generatedAt,
        });

        setState({
          rows: response.queries,
          generatedAt: response.generatedAt,
          error: null,
          isInitialLoading: false,
          isRefreshing: false,
        });
      } catch (QuerySubscriptionsError) {
        if (isCancelled() === true) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error: QuerySubscriptionsError instanceof Error ? QuerySubscriptionsError.message : String(QuerySubscriptionsError),
          isInitialLoading: false,
          isRefreshing: false,
        }));
      } finally {
        isFetchingRef.current = false;
      }
    };

    void load(nextCachedTelemetry === null ? "initial" : "refresh");
    const intervalId = window.setInterval(() => {
      void load("refresh");
    }, LIVE_QUERY_POLL_MS);

    return () => {
      cancelled = true;
      isFetchingRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [connectionConfig]);

  return {
    rows: state.rows,
    generatedAt: state.generatedAt,
    error: state.error,
    isInitialLoading: state.isInitialLoading,
    isRefreshing: state.isRefreshing,
  };
}
