import { Box, Button, Select, Switch, Text } from '@inspektor/ds'
import { type ReactElement, useId } from 'react'

import {
  type PlaygroundControl,
  type PlaygroundState,
  type PlaygroundValue,
} from '@/components/docs/playground/playgroundTypes'

interface PlaygroundControlsProps<TState extends PlaygroundState> {
  controls: readonly PlaygroundControl<TState>[]
  state: TState
  onChange: (key: keyof TState, value: PlaygroundValue) => void
  onReset: () => void
}

function SelectControl<TState extends PlaygroundState>({
  control,
  id,
  value,
  onChange,
}: {
  control: Extract<PlaygroundControl<TState>, { kind: 'select' }>
  id: string
  value: string
  onChange: (value: string) => void
}): ReactElement {
  return (
    <Select.Root
      value={value}
      onValueChange={(nextValue) => onChange(nextValue ?? value)}
    >
      <Select.Trigger
        id={id}
        size="s"
        width="full"
        aria-label={control.label}
      />
      <Select.Content>
        {control.options.map((option) => (
          <Select.Item
            key={option.value}
            value={option.value}
          >
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}

function ControlRow<TState extends PlaygroundState>({
  control,
  value,
  onChange,
}: {
  control: PlaygroundControl<TState>
  value: PlaygroundValue
  onChange: (key: keyof TState, value: PlaygroundValue) => void
}): ReactElement {
  const controlId = useId()

  return (
    <Box
      alignItems="center"
      gap="l"
    >
      <Box
        flex={1}
        flexBasis={0}
        minWidth={0}
      >
        <Text
          as="label"
          htmlFor={controlId}
          variant="body"
          color="muted"
        >
          {control.label}
        </Text>
      </Box>
      <Box
        flex={1}
        flexBasis={0}
        minWidth={0}
        justifyContent="end"
      >
        {control.kind === 'boolean' ? (
          <Switch
            id={controlId}
            size="s"
            aria-label={control.label}
            checked={value === true}
            onCheckedChange={(checked) => onChange(control.key, checked)}
          />
        ) : (
          <SelectControl
            id={controlId}
            control={control}
            value={String(value)}
            onChange={(nextValue) => onChange(control.key, nextValue)}
          />
        )}
      </Box>
    </Box>
  )
}

export function PlaygroundControls<TState extends PlaygroundState>({
  controls,
  state,
  onChange,
  onReset,
}: PlaygroundControlsProps<TState>): ReactElement {
  return (
    <Box
      flexDirection="column"
      gap="xl"
    >
      <Box
        alignItems="center"
        justifyContent="between"
        gap="l"
      >
        <Text variant="label">Properties</Text>
        <Button
          variant="ghost"
          size="s"
          onClick={onReset}
          aria-label="Reset controls"
        >
          Reset
        </Button>
      </Box>
      <Box
        flexDirection="column"
        gap="l"
      >
        {controls.map((control) => (
          <ControlRow
            key={control.key}
            control={control}
            value={state[control.key]}
            onChange={onChange}
          />
        ))}
      </Box>
    </Box>
  )
}
