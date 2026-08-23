import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { codeEditorItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import LongValueExample from './longValueExample'
import longValueSource from './longValueExample.tsx?raw'
import { CodeEditorPlayground } from './playground'
import { codeEditorPropNames } from './props'

const codeEditorProps = getGeneratedProps(codeEditorItem.componentId, codeEditorPropNames)

export function CodeEditorPage(): ReactElement {
  return (
    <CodeEditorPlayground>
      <Section
        title="JSON field"
        description="CodeEditor participates in Field labeling while CodeMirror owns editing and JSON language behavior."
      >
        <Example
          source={basicSource}
          align="stretch"
        >
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Adaptive presentation"
        description="Long source grows to a compact cap, then expands without replacing the editor instance."
      >
        <Example
          source={longValueSource}
          align="stretch"
        >
          <LongValueExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={codeEditorProps} />
      </Section>
    </CodeEditorPlayground>
  )
}
