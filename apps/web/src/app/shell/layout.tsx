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
      overflow="hidden"
      backgroundColor="bg-page"
      color="text-default"
      height="screen-height-dynamic"
    >
      <InspectorHeader />
      <Box as="main" minHeight={0} minWidth={0} flex={1} overflow="hidden">
        {children}
      </Box>
      <InspectorDock leftDock={leftDock} />
    </Box>
  );
}
