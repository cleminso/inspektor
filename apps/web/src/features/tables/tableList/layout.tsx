// TODO: left-dock layout is only consumed in /tables for now.
// Placed here until another feature (queries) needs the same logic
import {
  Box,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizablePanelRef,
  type ResizablePanelSize,
} from "@inspector/ds";
import { createContext, use, useCallback, useMemo, useState } from "react";

interface SidePanelLayoutContextValue {
  isOpen: boolean;
  panelRef: ReturnType<typeof useResizablePanelRef>;
  setIsOpenFromSize: (size: ResizablePanelSize) => void;
  toggle: () => void;
}

const SidePanelLayoutContext = createContext<SidePanelLayoutContextValue | null>(null);

export function useSidePanelLayout(): SidePanelLayoutContextValue {
  const value = use(SidePanelLayoutContext);

  if (value === null) {
    throw new Error("SidePanelLayout components must be rendered within SidePanelLayoutProvider");
  }

  return value;
}

interface SidePanelLayoutRootProps {
  children: React.ReactNode;
}

export function SidePanelLayoutProvider({
  children,
}: SidePanelLayoutRootProps): React.ReactElement {
  const panelRef = useResizablePanelRef();
  const [isOpen, setIsOpen] = useState(false);

  const setIsOpenFromSize = useCallback((size: ResizablePanelSize) => {
    setIsOpen(size.inPixels > 0);
  }, []);

  const toggle = useCallback(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }

    if (isOpen === true) {
      panel.collapse();
      setIsOpen(false);
    } else {
      panel.expand();
      setIsOpen(true);
    }
  }, [isOpen, panelRef]);

  const contextValue = useMemo(
    () => ({ isOpen, panelRef, setIsOpenFromSize, toggle }),
    [isOpen, panelRef, setIsOpenFromSize, toggle],
  );

  return (
    <SidePanelLayoutContext.Provider value={contextValue}>
      {children}
    </SidePanelLayoutContext.Provider>
  );
}

function SidePanelLayoutRoot({ children }: SidePanelLayoutRootProps): React.ReactElement {
  return (
    <Box width="full" height="full" minHeight={0} flex={1} overflow="hidden">
      <ResizablePanelGroup orientation="horizontal">{children}</ResizablePanelGroup>
    </Box>
  );
}

interface SidePanelLayoutPartProps {
  children: React.ReactNode;
}

function SidePanelLayoutPanel({ children }: SidePanelLayoutPartProps): React.ReactElement {
  const { isOpen, panelRef, setIsOpenFromSize } = useSidePanelLayout();

  return (
    <>
      <ResizablePanel
        panelRef={panelRef}
        collapsible
        collapsedSize={0}
        defaultSize={0}
        minSize={160}
        maxSize={360}
        onResize={setIsOpenFromSize}
      >
        <Box width="full" height="full" minHeight={0} overflow="hidden">
          {children}
        </Box>
      </ResizablePanel>
      {isOpen === true ? <ResizableHandle /> : null}
    </>
  );
}

function SidePanelLayoutContent({ children }: SidePanelLayoutPartProps): React.ReactElement {
  return (
    <ResizablePanel>
      <Box width="full" height="full" minHeight={0} overflow="hidden">
        {children}
      </Box>
    </ResizablePanel>
  );
}

export const SidePanelLayout = Object.assign(SidePanelLayoutRoot, {
  Content: SidePanelLayoutContent,
  Panel: SidePanelLayoutPanel,
});
