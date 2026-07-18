import { Box, Field, Switch } from "@inspector/ds";
import { type ReactElement } from "react";

export default function StatesExample(): ReactElement {
  return (
    <Box flexDirection="column" gap="m">
      <Field.Root>
        <Field.Label>
          <Switch size="s" />
          Small
        </Field.Label>
      </Field.Root>
      <Field.Root>
        <Field.Label>
          <Switch defaultChecked />
          Checked
        </Field.Label>
      </Field.Root>
      <Field.Root disabled>
        <Field.Label>
          <Switch />
          Disabled
        </Field.Label>
      </Field.Root>
      <Field.Root>
        <Field.Label>
          <Switch defaultChecked readOnly />
          Read-only
        </Field.Label>
      </Field.Root>
    </Box>
  );
}
