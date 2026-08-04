import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { FindBarPlayground } from './playground'
import { findBarPropNames } from './props'
import StatesExample from './statesExample'
import statesSource from './statesExample.tsx?raw'

const findBarProps = getGeneratedProps('findBar', findBarPropNames)

export function FindBarPage(): ReactElement {
  return (
    <FindBarPlayground>
      <Section
        title="Document navigation"
        description="Find Bar edits an application-owned query, controls case, whole-word, and regular-expression matching, and requests occurrence navigation without owning the searched document."
      >
        <Example
          source={basicSource}
          align="stretch"
        >
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Idle and empty states"
        description="Navigation remains unavailable until the document reports at least one occurrence for the active query options."
      >
        <Example
          source={statesSource}
          align="stretch"
        >
          <StatesExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={findBarProps} />
      </Section>
    </FindBarPlayground>
  )
}
