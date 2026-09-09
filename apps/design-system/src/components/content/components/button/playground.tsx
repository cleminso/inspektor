import {
  Box,
  Button,
  type ButtonLayout,
  type ButtonRadius,
  type ButtonSize,
  type ButtonVariant,
} from '@inspektor/ds'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { type ReactElement, useState } from 'react'

import { ComponentDocsPage } from '@/components/docs/componentDocsPage'
import { PlaygroundControls } from '@/components/docs/playground/playgroundControls'
import {
  createPlaygroundSource,
  playgroundIconSource,
} from '@/components/docs/playground/playgroundSource'
import { type PlaygroundControl } from '@/components/docs/playground/playgroundTypes'
import { buttonItem } from '@/lib/registry'

export interface ButtonPlaygroundState {
  variant: ButtonVariant
  size: ButtonSize
  radius: ButtonRadius
  layout: ButtonLayout
  loading: boolean
  disabled: boolean
  iconOnly: boolean
  prefix: boolean
  suffix: boolean
  [key: string]: boolean | string
}

function createInitialState(variant: ButtonVariant): ButtonPlaygroundState {
  return {
    variant,
    size: 'm',
    radius: 'xs',
    layout: 'inline',
    loading: false,
    disabled: false,
    iconOnly: false,
    prefix: false,
    suffix: false,
  }
}

const buttonExamples = [
  { key: 'primary', label: 'Primary action' },
  { key: 'secondary', label: 'Secondary action' },
  { key: 'danger', label: 'Danger action' },
] as const

type ButtonExampleKey = (typeof buttonExamples)[number]['key']
type ButtonPlaygroundStates = Record<ButtonExampleKey, ButtonPlaygroundState>

const initialStates: ButtonPlaygroundStates = {
  primary: createInitialState('primary'),
  secondary: createInitialState('secondary'),
  danger: createInitialState('danger'),
}

const controls = [
  {
    kind: 'select',
    key: 'variant',
    label: 'Variant',
    options: ['primary', 'secondary', 'danger', 'ghost', 'link'].map((value) => ({
      label: value,
      value,
    })),
  },
  {
    kind: 'select',
    key: 'size',
    label: 'Size',
    options: ['xs', 's', 'm'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'radius',
    label: 'Radius',
    options: ['none', 'xs', 's', 'm'].map((value) => ({ label: value, value })),
  },
  {
    kind: 'select',
    key: 'layout',
    label: 'Layout',
    options: ['inline', 'row', 'stacked'].map((value) => ({ label: value, value })),
  },
  { kind: 'boolean', key: 'loading', label: 'Loading' },
  { kind: 'boolean', key: 'disabled', label: 'Disabled' },
  { kind: 'boolean', key: 'iconOnly', label: 'Icon only' },
  { kind: 'boolean', key: 'prefix', label: 'Prefix' },
  { kind: 'boolean', key: 'suffix', label: 'Suffix' },
] as const satisfies readonly PlaygroundControl<ButtonPlaygroundState>[]

function serializeProps(state: ButtonPlaygroundState, label: string): string[] {
  const props: string[] = []
  if (state.variant !== 'primary') props.push(`variant="${state.variant}"`)
  if (state.size !== 'm') props.push(`size="${state.size}"`)
  if (state.radius !== 'xs') props.push(`radius="${state.radius}"`)
  if (state.iconOnly === false && state.layout !== 'inline') props.push(`layout="${state.layout}"`)
  if (state.loading === true) props.push('loading')
  if (state.disabled === true) props.push('disabled')
  if (state.iconOnly === true) {
    props.push('iconOnly')
    props.push(`aria-label="${label}"`)
    return props
  }
  if (state.prefix === true) {
    props.push(`prefix={${playgroundIconSource.arrowLeft}}`)
  }
  if (state.suffix === true) {
    props.push(`suffix={${playgroundIconSource.arrowRight}}`)
  }
  return props
}

function serializeButton(state: ButtonPlaygroundState, label: string): string {
  const props = serializeProps(state, label)
  const children = state.iconOnly === true ? playgroundIconSource.arrowRight : label
  const button =
    props.length === 0
      ? `<Button>${label}</Button>`
      : `<Button\n  ${props.join('\n  ')}\n>${children}</Button>`

  return button
}

export function serializeButtonPlayground(states: ButtonPlaygroundStates): string {
  const buttons = buttonExamples
    .map(({ key, label }) =>
      serializeButton(states[key], label)
        .split('\n')
        .map((line) => `      ${line}`)
        .join('\n'),
    )
    .join('\n')

  return createPlaygroundSource({
    imports: { Button: true },
    example: `(\n    <>\n${buttons}\n    </>\n  )`,
  })
}

function updateButtonState(
  current: ButtonPlaygroundState,
  key: keyof ButtonPlaygroundState,
  value: boolean | string,
): ButtonPlaygroundState {
  if (key === 'iconOnly' && value === true) {
    return {
      ...current,
      iconOnly: true,
      layout: 'inline',
      prefix: false,
      suffix: false,
    }
  }

  if (key === 'iconOnly') {
    return { ...current, iconOnly: false }
  }

  const usesLabelLayout = key === 'layout' || key === 'prefix' || key === 'suffix'
  return {
    ...current,
    [key]: value,
    iconOnly: usesLabelLayout === true ? false : current.iconOnly,
  }
}

function ButtonPreview({
  label,
  state,
}: {
  label: string
  state: ButtonPlaygroundState
}): ReactElement {
  const sharedProps = {
    variant: state.variant,
    size: state.size,
    radius: state.radius,
    loading: state.loading,
    disabled: state.disabled,
  } as const

  if (state.iconOnly === true) {
    return (
      <Button
        {...sharedProps}
        iconOnly
        aria-label={label}
      >
        <Button.Glyph artwork={ArrowRight} />
      </Button>
    )
  }

  return (
    <Button
      {...sharedProps}
      layout={state.layout}
      prefix={state.prefix === true ? <Button.Glyph artwork={ArrowLeft} /> : undefined}
      suffix={state.suffix === true ? <Button.Glyph artwork={ArrowRight} /> : undefined}
    >
      {label}
    </Button>
  )
}

export function ButtonPlayground(): ReactElement {
  const [states, setStates] = useState<ButtonPlaygroundStates>(initialStates)

  return (
    <ComponentDocsPage
      item={buttonItem}
      preview={
        <Box
          alignItems="center"
          justifyContent="center"
          flexWrap="wrap"
          gap="l"
        >
          {buttonExamples.map(({ key, label }) => (
            <ButtonPreview
              key={key}
              label={label}
              state={states[key]}
            />
          ))}
        </Box>
      }
      sourceCode={serializeButtonPlayground(states)}
      controls={
        <Box
          width="full"
          flexDirection="column"
          gap="2xl"
        >
          {buttonExamples.map(({ key, label }) => (
            <PlaygroundControls
              key={key}
              title={label}
              controls={controls}
              state={states[key]}
              onChange={(property, value) =>
                setStates((current) => ({
                  ...current,
                  [key]: updateButtonState(current[key], property, value),
                }))
              }
              onReset={() => setStates((current) => ({ ...current, [key]: initialStates[key] }))}
            />
          ))}
        </Box>
      }
    />
  )
}
