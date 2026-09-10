import { Box, ResizableHandle, ResizablePanel, ResizablePanelGroup, Text } from '@inspektor/ds'
import { type ReactElement } from 'react'

export default function ResizablePanelSplitViewDemo(): ReactElement {
  return (
    <Box
      width="full"
      height="viewport-height-m"
      borderWidth={1}
      borderStyle="solid"
      borderColor="default"
    >
      <ResizablePanelGroup>
        <ResizablePanel
          id="table-navigation"
          defaultSize="40%"
          minSize="25%"
          collapsible
        >
          <Box
            height="full"
            alignItems="center"
            justifyContent="center"
            backgroundColor="element-default"
          >
            <Text>Tables</Text>
          </Box>
        </ResizablePanel>
        <ResizableHandle appearance="grip" />
        <ResizablePanel
          id="record-inspector"
          minSize="35%"
        >
          <Box
            height="full"
            alignItems="center"
            justifyContent="center"
          >
            <Text>Record inspector</Text>
          </Box>
        </ResizablePanel>
      </ResizablePanelGroup>
    </Box>
  )
}
