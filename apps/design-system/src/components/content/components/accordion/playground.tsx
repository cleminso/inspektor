import { Accordion, Box, Text, type AccordionLayout, type AccordionValue } from '@inspektor/ds'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import { createPlaygroundSource } from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { accordionItem } from '@/lib/registry'

export interface AccordionPlaygroundState {
  layout: AccordionLayout
  multiple: boolean
  disabled: boolean
  itemDisabled: boolean
  showSuffix: boolean
  [key: string]: boolean | string
}

const initialState: AccordionPlaygroundState = {
  layout: 'content',
  multiple: false,
  disabled: false,
  itemDisabled: false,
  showSuffix: true,
}

const initialValue: AccordionValue[] = ['tables']

const controls = [
  {
    kind: 'select',
    key: 'layout',
    label: 'Layout',
    options: ['content', 'fill'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'multiple', label: 'Multiple' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'itemDisabled', label: 'Disable filters' },
  { kind: 'boolean', key: 'showSuffix', label: 'Show count' },
] as const satisfies readonly PlaygroundControl<AccordionPlaygroundState>[]

export function serializeAccordionPlayground(state: AccordionPlaygroundState): string {
  const rootProps = [
    `defaultValue={[${state.multiple === true ? '"tables", "filters"' : '"tables"'}]}`,
    state.layout !== 'content' ? `layout="${state.layout}"` : null,
    state.multiple === true ? 'multiple' : null,
    state.disabled === true ? 'disabled' : null,
  ].filter((prop): prop is string => prop !== null)
  const tablesTrigger = state.showSuffix
    ? '<Accordion.Trigger suffix={<Text color="muted">14</Text>}>Tables</Accordion.Trigger>'
    : '<Accordion.Trigger>Tables</Accordion.Trigger>'
  const filtersDisabled = state.itemDisabled === true ? ' disabled' : ''

  return createPlaygroundSource({
    imports: { Accordion: true, Text: true },
    example: `(
    <Accordion
      ${rootProps.join('\n      ')}
    >
      <Accordion.Item value="tables">
        <Accordion.Header>
          ${tablesTrigger}
        </Accordion.Header>
        <Accordion.Panel>
          <Text color="muted">Table navigation content</Text>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="filters"${filtersDisabled}>
        <Accordion.Header>
          <Accordion.Trigger>Filters</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel>
          <Text color="muted">Filter controls</Text>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )`,
  })
}

export function AccordionPlayground(): ReactElement {
  const [state, setState] = useState<AccordionPlaygroundState>(initialState)
  const [value, setValue] = useState<AccordionValue[]>(initialValue)

  return (
    <ComponentDocsPage
      item={accordionItem}
      preview={
        <Box
          width="popup-width-m"
          height="panel-height"
        >
          <Accordion
            value={value}
            onValueChange={(nextValue) => setValue([...nextValue])}
            layout={state.layout}
            multiple={state.multiple}
            disabled={state.disabled}
          >
            <Accordion.Item value="tables">
              <Accordion.Header>
                <Accordion.Trigger
                  suffix={state.showSuffix === true ? <Text color="muted">14</Text> : undefined}
                >
                  Tables
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <Text color="muted">Table navigation content</Text>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item
              value="filters"
              disabled={state.itemDisabled}
            >
              <Accordion.Header>
                <Accordion.Trigger>Filters</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <Text color="muted">Filter controls</Text>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Box>
      }
      sourceCode={serializeAccordionPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, nextValue) => {
            setState((current) => ({ ...current, [key]: nextValue }))
            if (key === 'multiple') {
              setValue(nextValue === true ? ['tables', 'filters'] : initialValue)
            }
          }}
          onReset={() => {
            setState(initialState)
            setValue(initialValue)
          }}
        />
      }
    />
  )
}
