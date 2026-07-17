import { KeyboardInput } from "@inspector/ds";
import { type ReactElement } from "react";

export default function CombinationExample(): ReactElement {
  return (
    <KeyboardInput modifiers={["meta", "shift"]} platform="macos">
      K
    </KeyboardInput>
  );
}
