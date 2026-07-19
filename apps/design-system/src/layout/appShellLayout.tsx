import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface AppShellLayoutValue {
  isControlsOpen: boolean;
  isNavigationOpen: boolean;
  toggleControls: () => void;
  toggleNavigation: () => void;
}

const AppShellLayoutContext = createContext<AppShellLayoutValue>({
  isControlsOpen: true,
  isNavigationOpen: true,
  toggleControls: () => undefined,
  toggleNavigation: () => undefined,
});

export function AppShellLayoutProvider({ children }: { children: ReactNode }): ReactElement {
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isNavigationOpen, setIsNavigationOpen] = useState(true);
  const value = useMemo(
    () => ({
      isControlsOpen,
      isNavigationOpen,
      toggleControls: () => setIsControlsOpen((isOpen) => isOpen === false),
      toggleNavigation: () => setIsNavigationOpen((isOpen) => isOpen === false),
    }),
    [isControlsOpen, isNavigationOpen],
  );

  return <AppShellLayoutContext.Provider value={value}>{children}</AppShellLayoutContext.Provider>;
}

export function useAppShellLayout(): AppShellLayoutValue {
  return useContext(AppShellLayoutContext);
}
