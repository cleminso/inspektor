import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { textFieldItem } from '@/lib/registry'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import CompositionExample from './compositionExample'
import compositionSource from './compositionExample.tsx?raw'
import ErrorExample from './errorExample'
import errorSource from './errorExample.tsx?raw'
import { TextFieldPlayground } from './playground'
import { textFieldPropNames } from './props'

const textFieldProps = getGeneratedProps(textFieldItem.componentId, textFieldPropNames)

export function TextFieldPage(): ReactElement {
  return (
    <TextFieldPlayground>
      <Section
        title="Text field"
        description="Import only TextField for the standard composition. Field owns validation state, while native required validity remains available to forms."
      >
        <Example
          source={basicSource}
          align="stretch"
        >
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Manual composition without TextField"
        description="This is the expanded equivalent. Use Field and Input directly only when the structure must differ from TextField."
      >
        <Example
          source={compositionSource}
          align="stretch"
        >
          <CompositionExample />
        </Example>
      </Section>

      <Section
        title="TextField with external error"
        description="Supplying an error makes the surrounding Field and its internal Input invalid."
      >
        <Example
          source={errorSource}
          align="stretch"
        >
          <ErrorExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="TextField accepts supported Input attributes and field validation props."
      >
        <PropsTable rows={textFieldProps} />
      </Section>
    </TextFieldPlayground>
  )
}
