export type PlaygroundValue = boolean | string
export type PlaygroundState = Record<string, PlaygroundValue>

interface PlaygroundControlBase<TState extends PlaygroundState> {
  key: keyof TState & string
  label: string
}

export interface PlaygroundBooleanControl<
  TState extends PlaygroundState,
> extends PlaygroundControlBase<TState> {
  kind: 'boolean'
}

export interface PlaygroundSelectControl<
  TState extends PlaygroundState,
> extends PlaygroundControlBase<TState> {
  kind: 'select'
  options: readonly { label: string; value: string }[]
}

export type PlaygroundControl<TState extends PlaygroundState> =
  | PlaygroundBooleanControl<TState>
  | PlaygroundSelectControl<TState>
