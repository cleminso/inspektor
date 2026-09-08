import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { PropsTable } from '@/components/docs/propsTable'
import { Section } from '@/components/docs/section'
import { getGeneratedProps } from '@/lib/propsData'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { themeSwitchPropNames } from './props'

const props = getGeneratedProps('themeSwitch', themeSwitchPropNames)

export function ThemeSwitchPage(): ReactElement {
  return (
    <>
      <Section
        title="Light and dark themes"
        description="Connect the controlled switch to the theme state owned by your application. The icon describes the destination theme."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section title="Props">
        <PropsTable rows={props} />
      </Section>
    </>
  )
}
