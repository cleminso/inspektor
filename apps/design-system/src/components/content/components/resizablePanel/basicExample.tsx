import {
  Box,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
} from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Box width="full" height="viewport-height-m" borderWidth={1} borderStyle="solid" borderColor="default">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={180} minSize={140} maxSize={280}>
          <Box height="full" alignItems="center" justifyContent="center" backgroundColor="element-default">
            <Text>Tables</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle appearance="gutter" />
        <ResizablePanel minSize="30%">
          <Box height="full" alignItems="center" justifyContent="center">
            <Text>Data grid</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle appearance="grip" />
        <ResizablePanel defaultSize={220} minSize={180} maxSize={320}>
          <Box height="full" alignItems="center" justifyContent="center" backgroundColor="element-default">
            <Text>Row editor</Text>
          </Box>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Box>
  );
}
