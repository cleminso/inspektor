import * as stylex from "@stylexjs/stylex";

import { keyboardInputStyles } from "./keyboardInput.styles";

export type KeyboardInputModifier = "alt" | "ctrl" | "meta" | "shift";
export type KeyboardInputPlatform = "macos" | "other";
export type KeyboardInputSize = "default" | "small";

export interface KeyboardInputProps {
  /** The key that completes the shortcut. */
  children: string;
  /** Modifiers included in the shortcut. They render in platform-standard order. */
  modifiers?: readonly KeyboardInputModifier[];
  /** Controls whether the Meta modifier renders as Command or Control. */
  platform?: KeyboardInputPlatform;
  /** Controls the shortcut hint's density. */
  size?: KeyboardInputSize;
}

interface ModifierLabel {
  accessibleName: string;
  visualName: string;
}

const modifierOrder: readonly KeyboardInputModifier[] = ["meta", "ctrl", "shift", "alt"];

function getModifierLabel(
  modifier: KeyboardInputModifier,
  platform: KeyboardInputPlatform,
): ModifierLabel {
  if (modifier === "meta") {
    return platform === "macos"
      ? { accessibleName: "Command", visualName: "⌘" }
      : { accessibleName: "Control", visualName: "Ctrl" };
  }

  if (modifier === "ctrl") {
    return { accessibleName: "Control", visualName: "Ctrl" };
  }

  if (modifier === "shift") {
    return { accessibleName: "Shift", visualName: "⇧" };
  }

  return {
    accessibleName: platform === "macos" ? "Option" : "Alt",
    visualName: "⌥",
  };
}

const sizeStyles = {
  default: undefined,
  small: keyboardInputStyles.small,
} satisfies Record<KeyboardInputSize, unknown>;

export function KeyboardInput({
  children,
  modifiers = [],
  platform = "other",
  size = "default",
}: KeyboardInputProps) {
  const includedModifiers = modifierOrder.filter((modifier) => modifiers.includes(modifier));
  const modifierLabels = includedModifiers.map((modifier) => getModifierLabel(modifier, platform));
  const accessibleName = [...modifierLabels.map(({ accessibleName: name }) => name), children].join(" ");

  return (
    <kbd
      aria-label={accessibleName}
      data-platform={platform}
      data-size={size}
      data-slot="keyboard-input"
      {...stylex.props(keyboardInputStyles.root, sizeStyles[size])}
    >
      <span aria-hidden="true" {...stylex.props(keyboardInputStyles.glyph)}>
        {modifierLabels.map(({ visualName }) => visualName).join("")}
        {children}
      </span>
    </kbd>
  );
}
