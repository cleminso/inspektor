import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface InspectorDockCenterContextValue {
  setTarget: (target: HTMLDivElement | null) => void;
  target: HTMLDivElement | null;
}

const InspectorDockCenterContext = createContext<InspectorDockCenterContextValue | null>(null);

export function InspectorDockCenterProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const setTargetRef = useCallback((nextTarget: HTMLDivElement | null) => {
    setTarget(nextTarget);
  }, []);

  return (
    <InspectorDockCenterContext value={{ setTarget: setTargetRef, target }}>
      {children}
    </InspectorDockCenterContext>
  );
}

export function InspectorDockCenterSlot(): React.ReactElement {
  const context = use(InspectorDockCenterContext);
  return <div ref={context?.setTarget} data-slot="inspector-dock-center" />;
}

export function InspectorDockCenterPortal({
  children,
}: {
  children: ReactNode;
}): React.ReactPortal | null {
  const context = use(InspectorDockCenterContext);
  if (context === null) {
    throw new Error("InspectorDockCenterPortal must be used within InspectorDockCenterProvider");
  }
  return context.target === null ? null : createPortal(children, context.target);
}
