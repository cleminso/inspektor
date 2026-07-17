import { KeyboardInput } from "@inspector/ds";
import { type ReactElement } from "react";

export default function PlatformExample(): ReactElement {
  return (
    <KeyboardInput modifiers={["meta", "shift"]} platform="other" size="small">
      K
    </KeyboardInput>
  );
}
