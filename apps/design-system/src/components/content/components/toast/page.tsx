import { type ReactElement } from 'react'

import { Example } from '@/components/docs/example'
import { Section } from '@/components/docs/section'

import BasicExample from './basicExample'
import basicSource from './basicExample.tsx?raw'
import { ToastPlayground } from './playground'
import PreserveExample from './preserveExample'
import preserveSource from './preserveExample.tsx?raw'
import PromiseExample from './promiseExample'
import promiseSource from './promiseExample.tsx?raw'

export function ToastPage(): ReactElement {
  return (
    <ToastPlayground withToaster={false}>
      <Section
        title="Semantic messages"
        description="Mount one Toaster and create neutral, success, warning, or error notifications through toasts. Use the brief duration for lightweight confirmations."
      >
        <Example source={basicSource}>
          <BasicExample />
        </Example>
      </Section>
      <Section
        title="Preserve"
        description="Preserve messages that must remain until the user dismisses them."
      >
        <Example source={preserveSource}>
          <PreserveExample />
        </Example>
      </Section>
      <Section
        title="Promise lifecycle"
        description="Use the promise helper to update one notification as asynchronous work completes."
      >
        <Example source={promiseSource}>
          <PromiseExample />
        </Example>
      </Section>
    </ToastPlayground>
  )
}
