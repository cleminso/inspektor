import {
  Box,
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Text,
  useResizablePanelRef,
} from '@inspector/ds'
import { type ReactElement, useState } from 'react'

export default function CollapsibleExample(): ReactElement {
  const listPanelRef = useResizablePanelRef()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleListPanel = (): void => {
    if (listPanelRef.current?.isCollapsed() === true) {
      listPanelRef.current.expand()
    } else {
      listPanelRef.current?.collapse()
    }
  }

  return (
    <Box
      width="full"
      height="panel-height"
    >
      <Box
        flexDirection="column"
        borderWidth={1}
        borderStyle="solid"
        borderColor="default"
      >
        <Box
          padding="m"
          borderBottomWidth={1}
          borderStyle="solid"
          borderColor="default"
        >
          <Button
            variant="secondary"
            size="s"
            onClick={toggleListPanel}
          >
            {isCollapsed === true ? 'Show tables' : 'Hide tables'}
          </Button>
        </Box>
        <Box
          flexGrow={1}
          minHeight={0}
        >
          <ResizablePanelGroup>
            <ResizablePanel
              panelRef={listPanelRef}
              minSize={140}
              maxSize={280}
              collapsedSize={0}
              collapsible
              onResize={(size) => setIsCollapsed(size.inPixels === 0)}
            >
              <Box
                height="full"
                alignItems="center"
                justifyContent="center"
                backgroundColor="element-default"
              >
                <Text>Table list</Text>
              </Box>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel>
              <Box
                height="full"
                alignItems="center"
                justifyContent="center"
              >
                <Text>Table explorer</Text>
              </Box>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Box>
      </Box>
    </Box>
  )
}
