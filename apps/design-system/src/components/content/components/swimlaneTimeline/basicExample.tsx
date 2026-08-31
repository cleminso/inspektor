import { SwimlaneTimeline } from '@inspector/ds'
import { useState, type ReactElement } from 'react'

export default function BasicExample(): ReactElement {
  const [selectedCell, setSelectedCell] = useState('messages-1412')

  return (
    <SwimlaneTimeline aria-label="Service activity">
      <SwimlaneTimeline.Header label="Services / tracks">
        <time dateTime="13:32">13:32</time>
        <time dateTime="13:52">13:52</time>
        <time dateTime="14:12">14:12</time>
      </SwimlaneTimeline.Header>
      <SwimlaneTimeline.Lane>
        <SwimlaneTimeline.LaneTrigger suffix="2">Messages</SwimlaneTimeline.LaneTrigger>
        <SwimlaneTimeline.Track label="e9c0b7ca3ad9a2c2f487c9b4062516c94273712720b4eeb7f78ef4243b882700">
          <SwimlaneTimeline.Cell
            label="Open Messages group at 13:32"
            status="active"
            selected={selectedCell === 'messages-1332'}
            onActivate={() => setSelectedCell('messages-1332')}
          />
          <SwimlaneTimeline.Cell
            label="Messages group inactive at 13:52"
            status="inactive"
          />
          <SwimlaneTimeline.Cell
            label="Open Messages group at 14:12"
            status="active"
            selected={selectedCell === 'messages-1412'}
            onActivate={() => setSelectedCell('messages-1412')}
          />
        </SwimlaneTimeline.Track>
        <SwimlaneTimeline.Track label="9a2f0e24d73a918084241377a82d81961d4a863371af53125959ba6d18bc2e80">
          <SwimlaneTimeline.Cell
            label="Messages archive inactive at 13:32"
            status="inactive"
          />
          <SwimlaneTimeline.Cell
            label="Open Messages archive at 13:52"
            status="active"
            selected={selectedCell === 'archive-1352'}
            onActivate={() => setSelectedCell('archive-1352')}
          />
          <SwimlaneTimeline.Cell
            label="Messages archive status unknown at 14:12"
            status="unknown"
          />
        </SwimlaneTimeline.Track>
      </SwimlaneTimeline.Lane>
      <SwimlaneTimeline.Lane defaultExpanded={false}>
        <SwimlaneTimeline.LaneTrigger suffix="1">Notifications</SwimlaneTimeline.LaneTrigger>
        <SwimlaneTimeline.Track label="6283d4478c4c08f9e1293a20867780c4550f8b3f1aab321ca0656234f481ecaa">
          <SwimlaneTimeline.Cell
            label="Open Notifications group at 13:32"
            status="active"
            selected={selectedCell === 'notifications-1332'}
            onActivate={() => setSelectedCell('notifications-1332')}
          />
          <SwimlaneTimeline.Cell
            label="Notifications group inactive at 13:52"
            status="inactive"
          />
          <SwimlaneTimeline.Cell
            label="Notifications group inactive at 14:12"
            status="inactive"
          />
        </SwimlaneTimeline.Track>
      </SwimlaneTimeline.Lane>
    </SwimlaneTimeline>
  )
}
