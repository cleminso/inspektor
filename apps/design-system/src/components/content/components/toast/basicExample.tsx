import { Box, Button, Toaster, toasts } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <Box gap="m" flexWrap="wrap">
      <Button variant="outline" onClick={() => toasts.message("Row inserted")}>Message</Button>
      <Button variant="outline" onClick={() => toasts.success("Connection saved")}>Success</Button>
      <Button variant="outline" onClick={() => toasts.warning("Schema changed")}>Warning</Button>
      <Button
        variant="outline"
        onClick={() => toasts.error("Couldn’t insert row", { description: "Review the values and try again" })}
      >
        Error
      </Button>
      <Button variant="outline" onClick={() => toasts.message("Row deleted", { undo: () => undefined })}>
        Undo
      </Button>
      <Toaster />
    </Box>
  );
}
