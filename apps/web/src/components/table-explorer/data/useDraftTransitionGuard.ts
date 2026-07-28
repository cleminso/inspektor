/**
 * Coordinates one active row draft with application-local and TanStack Router transitions.
 * The editor owns field state; this hook owns only lifecycle and continuation state.
 *
 * A clean request runs immediately. A dirty request keeps the current editor mounted and remembers
 * the first local destination. Keep editing drops that destination, Discard and continue marks the
 * draft clean before proceeding, and Save and continue proceeds only after the mutation succeeds.
 * A router-blocked destination takes priority if both forms of transition are present.
 */
import { useCallback, useRef, useState } from "react";

import { useBlocker } from "@tanstack/react-router";

type DraftPhase = "clean" | "dirty" | "saving";

interface DraftTransitionGuard {
  /** Explicit Cancel: abandon the draft and any requested destination. */
  clear: () => void;
  /** Mark the draft clean and proceed with the requested destination. */
  discardAndContinue: () => void;
  /** Receive semantic dirty state from the mounted draft owner. */
  handleDirtyChange: (isDirty: boolean) => void;
  isPending: boolean;
  isSaving: boolean;
  /** Drop the requested destination while leaving the draft dirty and mounted. */
  keepEditing: () => void;
  /** Run now when clean, or remember the first destination while dirty or saving. */
  request: (transition: () => void) => void;
  /** Run a mutation and report whether success continued a pending destination. */
  runMutation: (mutation: () => Promise<void>) => Promise<boolean>;
}

/** Protects one active draft from target-changing transitions. */
export function useDraftTransitionGuard(): DraftTransitionGuard {
  // State renders the lifecycle; refs let same-event navigation observe its current value.
  const [phase, setPhaseState] = useState<DraftPhase>("clean");
  const phaseRef = useRef<DraftPhase>("clean");
  const pendingTransitionRef = useRef<(() => void) | null>(null);
  const [hasPendingTransition, setHasPendingTransition] = useState(false);

  const setPhase = useCallback((nextPhase: DraftPhase) => {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }, []);

  const routeBlocker = useBlocker({
    disabled: phase === "clean" && hasPendingTransition === false,
    enableBeforeUnload: phase !== "clean" || hasPendingTransition === true,
    shouldBlockFn: useCallback(
      () => phaseRef.current !== "clean" || pendingTransitionRef.current !== null,
      [],
    ),
    withResolver: true,
  });
  const routeBlockerRef = useRef(routeBlocker);
  routeBlockerRef.current = routeBlocker;

  const clearPendingTransition = useCallback(() => {
    pendingTransitionRef.current = null;
    setHasPendingTransition(false);
  }, []);

  const continuePendingTransition = useCallback((): boolean => {
    const pendingTransition = pendingTransitionRef.current;
    const blockedRoute = routeBlockerRef.current;
    if (pendingTransition === null && blockedRoute.status !== "blocked") {
      return false;
    }

    // Clear first so synchronous navigation cannot block on the transition being resolved.
    clearPendingTransition();
    if (blockedRoute.status === "blocked") {
      // A router destination supersedes an application-local transition when both exist.
      blockedRoute.proceed();
    } else {
      pendingTransition?.();
    }
    return true;
  }, [clearPendingTransition]);

  const request = useCallback((transition: () => void) => {
    if (phaseRef.current === "clean" && pendingTransitionRef.current === null) {
      transition();
      return;
    }
    if (pendingTransitionRef.current === null) {
      // Keep the destination that opened the decision UI; later clicks must not replace it.
      pendingTransitionRef.current = transition;
      setHasPendingTransition(true);
    }
  }, []);

  const handleDirtyChange = useCallback(
    (isDirty: boolean) => {
      if (phaseRef.current === "saving") {
        return;
      }
      if (isDirty === true) {
        setPhase("dirty");
        return;
      }

      setPhase("clean");
      // Returning every field to its source leaves nothing to save or discard.
      continuePendingTransition();
    },
    [continuePendingTransition, setPhase],
  );

  const runMutation = useCallback(
    async (mutation: () => Promise<void>): Promise<boolean> => {
      const previousPhase = phaseRef.current;
      setPhase("saving");
      try {
        await mutation();
        setPhase("clean");
        // The result tells callers whether navigation replaced their normal post-save behavior.
        const continued = continuePendingTransition();
        return continued;
      } catch (error) {
        setPhase(previousPhase);
        throw error;
      }
    },
    [continuePendingTransition, setPhase],
  );

  const discardAndContinue = useCallback(() => {
    setPhase("clean");
    continuePendingTransition();
  }, [continuePendingTransition, setPhase]);

  const clear = useCallback(() => {
    // Explicit form Cancel abandons both the draft lifecycle and any earlier destination request.
    clearPendingTransition();
    if (routeBlocker.status === "blocked") {
      routeBlocker.reset();
    }
    setPhase("clean");
  }, [clearPendingTransition, routeBlocker, setPhase]);

  const keepEditing = useCallback(() => {
    clearPendingTransition();
    if (routeBlocker.status === "blocked") {
      routeBlocker.reset();
    }
  }, [clearPendingTransition, routeBlocker]);

  return {
    clear,
    discardAndContinue,
    handleDirtyChange,
    isPending: hasPendingTransition === true || routeBlocker.status === "blocked",
    isSaving: phase === "saving",
    keepEditing,
    request,
    runMutation,
  };
}
