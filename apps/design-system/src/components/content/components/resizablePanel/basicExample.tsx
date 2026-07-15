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
    <Box width="100%" height={240} borderWidth={1} borderStyle="solid" borderColor="border">
      <ResizablePanelGroup>
        <ResizablePanel defaultSize={180} minSize={140} maxSize={280}>
          <Box height="100%" alignItems="center" justifyContent="center" backgroundColor="bg-secondary">
            <Text>Tables</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel minSize="30%">
          <Box height="100%" alignItems="center" justifyContent="center">
            <Text>Data grid</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle appearance="grip" />
        <ResizablePanel defaultSize={220} minSize={180} maxSize={320}>
          <Box height="100%" alignItems="center" justifyContent="center" backgroundColor="bg-secondary">
            <Text>Row editor</Text>
          </Box>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Box>
  );
}
