import { Box, Button, Toaster, toasts } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Box gap="m" flexWrap="wrap">
      <Button variant="secondary" onClick={() => toasts.message("Row inserted")}>Message</Button>
      <Button variant="secondary" onClick={() => toasts.success("Connection saved")}>Success</Button>
      <Button
        variant="secondary"
        onClick={() => toasts.success("Cell value copied", { duration: "brief" })}
      >
        Brief success
      </Button>
      <Button variant="secondary" onClick={() => toasts.warning("Schema changed")}>Warning</Button>
      <Button
        variant="secondary"
        onClick={() => toasts.error("Couldn’t insert row", { description: "Review the values and try again" })}
      >
        Error
      </Button>
      <Button variant="secondary" onClick={() => toasts.message("Row deleted", { undo: () => undefined })}>
        Undo
      </Button>
      <Toaster />
    </Box>
  );
}
