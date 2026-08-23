import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import NullableExample from './nullableExample'
import nullableSource from './nullableExample.tsx?raw'
import { InputGroupPlayground } from './playground'
import {
  inputGroupActionPropNames,
  inputGroupCheckboxPropNames,
  inputGroupPrefixPropNames,
  inputGroupRootPropNames,
  inputGroupSuffixPropNames,
} from './props'

const rootProps = getGeneratedProps('inputGroup.root', inputGroupRootPropNames)
const prefixProps = getGeneratedProps('inputGroup.prefix', inputGroupPrefixPropNames)
const suffixProps = getGeneratedProps('inputGroup.suffix', inputGroupSuffixPropNames)
const actionProps = getGeneratedProps('inputGroup.action', inputGroupActionPropNames)
const checkboxProps = getGeneratedProps('inputGroup.checkbox', inputGroupCheckboxPropNames)

export function InputGroupPage(): ReactElement {
  return (
    <InputGroupPlayground>
      <Section
        title="Static affixes"
        description="Place Input and InputGroup parts as direct children so they share one border and focus treatment."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>

      <Section
        title="Nullable value"
        description="A labeled checkbox can control whether the adjacent input contributes a concrete value."
      >
        <Example source={nullableSource}>
          <NullableExample />
        </Example>
      </Section>

      <Section title="Root props">
        <PropsTable rows={rootProps} />
      </Section>
      <Section title="Prefix props">
        <PropsTable rows={prefixProps} />
      </Section>
      <Section title="Suffix props">
        <PropsTable rows={suffixProps} />
      </Section>
      <Section title="Action props">
        <PropsTable rows={actionProps} />
      </Section>
      <Section title="Checkbox props">
        <PropsTable rows={checkboxProps} />
      </Section>
    </InputGroupPlayground>
  )
}
