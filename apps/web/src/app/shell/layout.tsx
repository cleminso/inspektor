import type { PropsWithChildren } from "react";

import { Box } from "@inspector/ds";

import { InspectorHeader } from "./header/view";
import { InspectorDock, type InspectorLeftDockControl } from "./dock/view";

interface InspectorLayoutProps extends PropsWithChildren {
  leftDock?: InspectorLeftDockControl;
}

export function InspectorLayout({ children, leftDock }: InspectorLayoutProps): React.ReactElement {
  return (
    <Box
      minHeight={0}
      width="full"
      flexDirection="column"
      rowGap="xs"
      overflow="hidden"
      position="fixed"
      inset="none"
      backgroundColor="surface-canvas"
      color="default"
      height="screen-height-dynamic"
      data-layout="viewport"
      data-page-scroll="locked"
    >
      <InspectorHeader />
      <Box
        as="main"
        minHeight={0}
        minWidth={0}
        flex={1}
        overflow="hidden"
      >
        {children}
      </Box>
      <InspectorDock leftDock={leftDock} />
    </Box>
  );
}
