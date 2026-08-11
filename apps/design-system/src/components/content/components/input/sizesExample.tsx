import { Input } from "@inspector/ds";
import { type ReactElement } from "react";

export default function SizesExample(): ReactElement {
  return (
    <>
      <Input size="xs" aria-label="Extra-small input" placeholder="Extra small" />
      <Input size="s" aria-label="Small input" placeholder="Small" />
      <Input size="m" aria-label="Medium input" placeholder="Medium" />
      <Input size="l" aria-label="Large input" placeholder="Large" />
    </>
  );
}
