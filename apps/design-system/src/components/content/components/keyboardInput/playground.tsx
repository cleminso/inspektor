import {
  KeyboardInput,
  type KeyboardInputModifier,
  type KeyboardInputPlatform,
  type KeyboardInputSize,
} from "@inspector/ds";
import { type ReactElement, type ReactNode, useState } from "react";

import { ComponentDocsPage } from "@/components/docs/componentDocsPage";
import { PlaygroundControls } from "@/components/docs/playground/playgroundControls";
import { createPlaygroundSource } from "@/components/docs/playground/playgroundSource";
import { type PlaygroundControl } from "@/components/docs/playground/playgroundTypes";
import { keyboardInputItem } from "@/lib/registry";

type KeyName = "K" | "Enter" | "Escape";

export interface KeyboardInputPlaygroundState {
  keyName: KeyName;
  platform: KeyboardInputPlatform;
  size: KeyboardInputSize;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  [key: string]: boolean | string;
}

const initialState: KeyboardInputPlaygroundState = {
  keyName: "K",
  platform: "other",
  size: "default",
  meta: false,
  ctrl: false,
  shift: false,
  alt: false,
};

const controls = [
  {
    kind: "select",
    key: "keyName",
    label: "Key",
    options: ["K", "Enter", "Escape"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "platform",
    label: "Platform",
    options: ["other", "macos"].map((value) => ({ label: value, value })),
  },
  {
    kind: "select",
    key: "size",
    label: "Size",
    options: ["default", "small"].map((value) => ({ label: value, value })),
  },
  { kind: "boolean", key: "meta", label: "Meta" },
  { kind: "boolean", key: "ctrl", label: "Control" },
  { kind: "boolean", key: "shift", label: "Shift" },
  { kind: "boolean", key: "alt", label: "Alt" },
] as const satisfies readonly PlaygroundControl<KeyboardInputPlaygroundState>[];

function getModifiers(state: KeyboardInputPlaygroundState): KeyboardInputModifier[] {
  return (["meta", "ctrl", "shift", "alt"] as const).filter((modifier) => state[modifier] === true);
}

export function serializeKeyboardInputPlayground(state: KeyboardInputPlaygroundState): string {
  const props: string[] = [];
  const modifiers = getModifiers(state);
  if (modifiers.length > 0) {
    props.push(`modifiers={[${modifiers.map((modifier) => `"${modifier}"`).join(", ")}]}`);
  }
  if (state.platform !== "other") props.push(`platform="${state.platform}"`);
  if (state.size !== "default") props.push(`size="${state.size}"`);
  const opening = props.length === 0 ? "<KeyboardInput>" : `<KeyboardInput ${props.join(" ")}>`;

  return createPlaygroundSource({
    imports: { KeyboardInput: true },
    example: `${opening}${state.keyName}</KeyboardInput>`,
  });
}

export function KeyboardInputPlayground({ children }: { children?: ReactNode }): ReactElement {
  const [state, setState] = useState<KeyboardInputPlaygroundState>(initialState);

  return (
    <ComponentDocsPage
      title={keyboardInputItem.title}
      description={keyboardInputItem.description}
      source={keyboardInputItem.source}
      preview={
        <KeyboardInput modifiers={getModifiers(state)} platform={state.platform} size={state.size}>
          {state.keyName}
        </KeyboardInput>
      }
      sourceCode={serializeKeyboardInputPlayground(state)}
      controls={
        <PlaygroundControls
          controls={controls}
          state={state}
          onChange={(key, value) => setState((current) => ({ ...current, [key]: value }))}
          onReset={() => setState(initialState)}
        />
      }
    >
      {children}
    </ComponentDocsPage>
  );
}
