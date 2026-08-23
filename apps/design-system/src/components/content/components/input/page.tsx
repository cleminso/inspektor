import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'
import { inputItem } from '@/lib/registry'

import { inputPropNames } from './props'
import { InputPlayground } from './playground'
import SizesExample from './sizesExample'
import sizesSource from './sizesExample.tsx?raw'
import StatesExample from './statesExample'
import statesSource from './statesExample.tsx?raw'
import TypographyExample from './typographyExample'
import typographySource from './typographyExample.tsx?raw'
import VariantsExample from './variantsExample'
import variantsSource from './variantsExample.tsx?raw'

const inputProps = getGeneratedProps(inputItem.componentId, inputPropNames)

export function InputPage(): ReactElement {
  return (
    <InputPlayground>
      <Section
        title="Sizes"
        description="Choose a height that matches nearby controls."
      >
        <Example source={sizesSource}>
          <SizesExample />
        </Example>
      </Section>

      <Section
        title="Variants"
        description="Use subtle for low-emphasis filtering controls that reveal their border on hover or focus."
      >
        <Example source={variantsSource}>
          <VariantsExample />
        </Example>
      </Section>

      <Section
        title="States"
        description="Input uses a neutral focused border and a danger border with a subtle halo when invalid."
      >
        <Example
          source={statesSource}
          align="stretch"
        >
          <StatesExample />
        </Example>
      </Section>

      <Section
        title="Typography"
        description="Use monospace for stored identifiers and other raw data values."
      >
        <Example
          source={typographySource}
          align="stretch"
        >
          <TypographyExample />
        </Example>
      </Section>

      <Section
        title="Props"
        description="Provide an accessible name with a label, Field, or aria-label."
      >
        <PropsTable rows={inputProps} />
      </Section>
    </InputPlayground>
  )
}
