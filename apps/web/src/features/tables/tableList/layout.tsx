// TODO: left-dock layout is only consumed in /tables for now.
// Placed here until another feature (queries) needs the same logic
import {
  Box,
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  useResizablePanelRef,
  type ResizablePanelSize,
} from "@inspector/ds";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { createContext, use, useCallback, useMemo, useState } from "react";

interface SidePanelLayoutContextValue {
  isOpen: boolean;
  panelRef: ReturnType<typeof useResizablePanelRef>;
  setIsOpenFromSize: (size: ResizablePanelSize) => void;
  toggle: () => void;
}

const SidePanelLayoutContext = createContext<SidePanelLayoutContextValue | null>(null);

function useSidePanelLayout(): SidePanelLayoutContextValue {
  const value = use(SidePanelLayoutContext);

  if (value === null) {
    throw new Error("SidePanelLayout components must be rendered within SidePanelLayout");
  }

  return value;
}

interface SidePanelLayoutRootProps {
  children: React.ReactNode;
}

function SidePanelLayoutRoot({ children }: SidePanelLayoutRootProps): React.ReactElement {
  const panelRef = useResizablePanelRef();
  const [isOpen, setIsOpen] = useState(true);

  const setIsOpenFromSize = useCallback((size: ResizablePanelSize) => {
    const nextIsOpen = size.inPixels > 0;
    setIsOpen((currentIsOpen) => (currentIsOpen === nextIsOpen ? currentIsOpen : nextIsOpen));
  }, []);

  const toggle = useCallback(() => {
    const panel = panelRef.current;
    if (panel === null) {
      return;
    }

    if (panel.isCollapsed() === true) {
      panel.expand();
      setIsOpen(true);
    } else {
      panel.collapse();
      setIsOpen(false);
    }
  }, [panelRef]);

  const contextValue = useMemo(
    () => ({ isOpen, panelRef, setIsOpenFromSize, toggle }),
    [isOpen, panelRef, setIsOpenFromSize, toggle],
  );

  return (
    <SidePanelLayoutContext.Provider value={contextValue}>
      <Box width="full" height="full" minHeight={0} flex={1} overflow="hidden">
        <ResizablePanelGroup orientation="horizontal">{children}</ResizablePanelGroup>
      </Box>
    </SidePanelLayoutContext.Provider>
  );
}

interface SidePanelLayoutPartProps {
  children: React.ReactNode;
}

function SidePanelLayoutPanel({ children }: SidePanelLayoutPartProps): React.ReactElement {
  const { panelRef, setIsOpenFromSize } = useSidePanelLayout();

  return (
    <>
      <ResizablePanel
        panelRef={panelRef}
        collapsible
        collapsedSize={0}
        defaultSize={218}
        minSize={160}
        maxSize={360}
        onResize={setIsOpenFromSize}
      >
        <Box width="full" height="full" minHeight={0} overflow="hidden">
          {children}
        </Box>
      </ResizablePanel>
      <ResizableHandle />
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

interface SidePanelLayoutToggleProps {
  label: string;
}

function SidePanelLayoutToggle({ label }: SidePanelLayoutToggleProps): React.ReactElement {
  const { isOpen, toggle } = useSidePanelLayout();

  return (
    <Button
      type="button"
      variant="ghost"
      size="s"
      aria-label={label}
      aria-pressed={isOpen}
      iconOnly
      title={label}
      onClick={toggle}
    >
      {isOpen === true ? (
        <PanelLeftClose aria-hidden="true" size={14} />
      ) : (
        <PanelLeftOpen aria-hidden="true" size={14} />
      )}
    </Button>
  );
}

export const SidePanelLayout = Object.assign(SidePanelLayoutRoot, {
  Content: SidePanelLayoutContent,
  Panel: SidePanelLayoutPanel,
  Toggle: SidePanelLayoutToggle,
});
