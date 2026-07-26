import { CodeEditor, Field } from "@inspector/ds";
import { useState } from "react";

const initialValue = JSON.stringify(
  {
    editor: {
      fontSize: 14,
      lineWrapping: true,
    },
  },
  null,
  2,
);

export default function BasicExample() {
  const [value, setValue] = useState(initialValue);

  return (
    <Field.Root>
      <Field.Label id="settings-json-label" htmlFor="settings-json">
        Editor settings
      </Field.Label>
      <CodeEditor
        id="settings-json"
        labelledBy="settings-json-label"
        toolbarLabel="JSON"
        value={value}
        onValueChange={setValue}
      />
    </Field.Root>
  );
}
