import { Button, toasts } from "@inspector/ds";
import { type ReactElement } from "react";

export default function PreserveExample(): ReactElement {
  return (
    <Button
      variant="outline"
      onClick={() => toasts.message("Inspector connection lost", { preserve: true })}
    >
      Show preserved toast
    </Button>
  );
}
