import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import { toggleGroupItemPropNames, toggleGroupRootPropNames } from './props'
import { ToggleGroupPlayground } from './playground'
import ViewSwitcherExample from './viewSwitcherExample'
import viewSwitcherSource from './viewSwitcherExample.tsx?raw'

const rootProps = getGeneratedProps('toggleGroup.root', toggleGroupRootPropNames)
const itemProps = getGeneratedProps('toggleGroup.item', toggleGroupItemPropNames)

export function ToggleGroupPage(): ReactElement {
  return (
    <ToggleGroupPlayground>
      <Section
        title="View switcher"
        description="Use a controlled single-selection group when one view must remain selected. Selected surfaces match hover because the pressed indicator communicates persistence."
      >
        <Example source={viewSwitcherSource}>
          <ViewSwitcherExample />
        </Example>
      </Section>

      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Item props">
        <PropsTable rows={itemProps} />
      </Section>
    </ToggleGroupPlayground>
  )
}
