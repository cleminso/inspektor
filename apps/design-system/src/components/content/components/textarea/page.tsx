import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { textareaItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { TextareaPlayground } from './playground'
import { textareaPropNames } from './props'

const textareaProps = getGeneratedProps(textareaItem.componentId, textareaPropNames)

export function TextareaPage(): ReactElement {
  return (
    <TextareaPlayground>
      <Section
        title="Multiline value"
        description="Textarea participates in Field labeling and validation."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section title="Props">
        <PropsTable rows={textareaProps} />
      </Section>
    </TextareaPlayground>
  )
}
