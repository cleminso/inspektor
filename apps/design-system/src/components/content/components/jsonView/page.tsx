import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import CollapsedRootExample from './collapsedRootExample'
import collapsedRootSource from './collapsedRootExample.tsx?raw'
import DefaultExpansionExample from './defaultExpansionExample'
import defaultExpansionSource from './defaultExpansionExample.tsx?raw'
import EmptyValuesExample from './emptyValuesExample'
import emptyValuesSource from './emptyValuesExample.tsx?raw'
import FindNavigationExample from './findNavigationExample'
import findNavigationSource from './findNavigationExample.tsx?raw'
import LargeBranchExample from './largeBranchExample'
import largeBranchSource from './largeBranchExample.tsx?raw'
import LongContentExample from './longContentExample'
import longContentSource from './longContentExample.tsx?raw'
import { JsonViewPlayground } from './playground'
import { jsonViewPropNames } from './props'

const jsonViewProps = getGeneratedProps('jsonView', jsonViewPropNames)

export function JsonViewPage(): ReactElement {
  return (
    <JsonViewPlayground>
      <Section
        title="Nested data"
        description="Objects and arrays expand one container level by default. Sticky root actions expand or collapse the complete safe tree and copy the complete JSON value."
      >
        <Example
          source={defaultExpansionSource}
          align="stretch"
        >
          <DefaultExpansionExample />
        </Example>
      </Section>

      <Section
        title="Collapsed root"
        description="Set the initial depth to zero when the surrounding surface should reveal the payload on demand."
      >
        <Example
          source={collapsedRootSource}
          align="stretch"
        >
          <CollapsedRootExample />
        </Example>
      </Section>

      <Section
        title="Empty and nullable values"
        description="Empty containers remain inline while null keeps its JSON primitive representation."
      >
        <Example
          source={emptyValuesSource}
          align="stretch"
        >
          <EmptyValuesExample />
        </Example>
      </Section>

      <Section
        title="Find navigation"
        description="Pair JsonView with Find Bar to control case, whole-word, and regular-expression matching and navigate ordered occurrences without moving focus from the query field."
      >
        <Example
          source={findNavigationSource}
          align="stretch"
        >
          <FindNavigationExample />
        </Example>
      </Section>

      <Section
        title="Long and narrow content"
        description="Long strings wrap within narrow panes and expose a deliberate action when the display budget is reached."
      >
        <Example
          source={longContentSource}
          align="start"
        >
          <LongContentExample />
        </Example>
      </Section>

      <Section
        title="Large branches"
        description="Large branches render in bounded batches. Continue through the branch with the Show more tree item."
      >
        <Example
          source={largeBranchSource}
          align="stretch"
        >
          <LargeBranchExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={jsonViewProps} />
      </Section>
    </JsonViewPlayground>
  )
}
