import { Button, toasts } from "@inspector/ds";
import { type ReactElement } from "react";

function saveConnection(): Promise<string> {
  return Promise.resolve("Production");
}

export default function PromiseExample(): ReactElement {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toasts.promise(saveConnection(), {
          loading: "Saving connection",
          success: (name) => `${name} connection saved`,
          error: "Could not save connection",
        })
      }
    >
      Save connection
    </Button>
  );
}
