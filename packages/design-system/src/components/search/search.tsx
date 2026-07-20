import * as stylex from "@stylexjs/stylex";

import { Input, type InputProps, type InputSize } from "../input/input";
import { KeyboardInput } from "../keyboardInput/keyboardInput";
import { searchStyles } from "./search.styles";

export interface SearchProps
  extends Omit<InputProps, "invalid" | "readOnly" | "render" | "type" | "variant"> {
  /** Controls the search input height. */
  size?: InputSize;
  /** Stretches the search control to the width of its container. */
  fullWidth?: boolean;
  /** Disables editing and exposes the disabled state to assistive technology. */
  disabled?: InputProps["disabled"];
  /** Shows the Command K keyboard shortcut hint. */
  shortcut?: "command-k";
  /** Sets the initial query when uncontrolled. */
  defaultValue?: InputProps["defaultValue"];
  /** Sets the current query when controlled. */
  value?: InputProps["value"];
  /** Runs when the query changes. */
  onValueChange?: InputProps["onValueChange"];
}

export function Search({
  size = "m",
  fullWidth = true,
  disabled = false,
  shortcut,
  ...props
}: SearchProps) {
  const rootStyleProps = stylex.props(
    searchStyles.root,
    fullWidth === true && searchStyles.fullWidth,
  );
  const inputStyleProps = stylex.props(
    searchStyles.input,
    shortcut === "command-k" && searchStyles.inputWithShortcut,
  );
  const iconStyleProps = stylex.props(searchStyles.icon, disabled === true && searchStyles.iconDisabled);

  return (
    <span {...rootStyleProps} data-slot="search">
      <Input
        {...props}
        type="search"
        size={size}
        variant="subtle"
        fullWidth={fullWidth}
        disabled={disabled}
        render={<input className={inputStyleProps.className} style={inputStyleProps.style} />}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        data-slot="search-icon"
        {...iconStyleProps}
      >
        <circle cx="7" cy="7" r="4" />
        <path d="m10 10 3 3" />
      </svg>
      {shortcut === "command-k" ? (
        <span
          {...stylex.props(
            searchStyles.shortcut,
            disabled === true && searchStyles.shortcutDisabled,
          )}
        >
          <KeyboardInput modifiers={["meta"]} platform="macos" size="small">
            K
          </KeyboardInput>
        </span>
      ) : null}
    </span>
  );
}
