import { Button } from "@inspector/ds";
import { Plus } from "lucide-react";
import { type ReactElement } from "react";

export default function SizesExample(): ReactElement {
  return (
    <>
      <Button size="s">Small</Button>
      <Button size="m">Medium</Button>
      <Button size="l">Large</Button>
      <Button size="icon-s" aria-label="Add small">
        <Plus aria-hidden="true" size={12} />
      </Button>
      <Button size="icon-m" aria-label="Add medium">
        <Plus aria-hidden="true" size={14} />
      </Button>
      <Button size="icon-l" aria-label="Add large">
        <Plus aria-hidden="true" size={16} />
      </Button>
    </>
  );
}
