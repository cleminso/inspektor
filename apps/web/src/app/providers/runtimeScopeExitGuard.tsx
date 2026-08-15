import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

interface RuntimeScopeExitGuard {
  isBlocked: () => boolean;
  setBlocker: (blockerId: symbol, blocked: boolean) => void;
}

const RuntimeScopeExitGuardContext = createContext<RuntimeScopeExitGuard | null>(null);

export function RuntimeScopeExitGuardProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const [blockedIds, setBlockedIds] = useState<ReadonlySet<symbol>>(() => new Set());
  const setBlocker = useCallback((blockerId: symbol, blocked: boolean) => {
    setBlockedIds((current) => {
      const containsBlocker = current.has(blockerId);
      if (containsBlocker === blocked) {
        return current;
      }
      const next = new Set(current);
      if (blocked === true) {
        next.add(blockerId);
      } else {
        next.delete(blockerId);
      }
      return next;
    });
  }, []);
  const isBlocked = useCallback(() => blockedIds.size > 0, [blockedIds]);
  const value = useMemo(() => ({ isBlocked, setBlocker }), [isBlocked, setBlocker]);

  return (
    <RuntimeScopeExitGuardContext.Provider value={value}>
      {children}
    </RuntimeScopeExitGuardContext.Provider>
  );
}

export function useRuntimeScopeExitGuard(): RuntimeScopeExitGuard {
  const context = useContext(RuntimeScopeExitGuardContext);
  if (context === null) {
    throw new Error("useRuntimeScopeExitGuard must be used within RuntimeScopeExitGuardProvider");
  }
  return context;
}

export function useRegisterRuntimeScopeExitBlocker(blocked: boolean): void {
  const { setBlocker } = useRuntimeScopeExitGuard();
  const blockerId = useRef(Symbol("runtime-scope-exit-blocker"));

  useEffect(() => {
    const currentBlockerId = blockerId.current;
    setBlocker(currentBlockerId, blocked);
    return () => {
      setBlocker(currentBlockerId, false);
    };
  }, [blocked, setBlocker]);
}
