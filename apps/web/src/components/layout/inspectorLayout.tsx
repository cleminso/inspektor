import type { PropsWithChildren } from "react";

import { Box } from "@inspector/ds";

import { InspectorHeader } from "./inspectorHeader";

export function InspectorLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <Box
      height="full"
      minHeight={0}
      width="full"
      flexDirection="column"
      overflow="hidden"
      backgroundColor="bg-page"
      color="text-default"
      unsafeClassName="h-svh"
    >
      <InspectorHeader />
      <Box as="main" minHeight={0} minWidth={0} flex={1} overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
