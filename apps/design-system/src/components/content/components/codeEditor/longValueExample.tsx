import { CodeEditor } from "@inspector/ds";
import { useState } from "react";

const initialValue = JSON.stringify(
  {
    editor: {
      fontSize: 14,
      fontLigatures: true,
      letterSpacing: -0.25,
      lineNumbers: "on",
      minimap: { enabled: false },
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: "all",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      wordWrap: "on",
    },
  },
  null,
  2,
);

export default function LongValueExample() {
  const [value, setValue] = useState(initialValue);

  return (
    <CodeEditor
      accessibilityLabel="Long JSON value"
      toolbarLabel="JSON"
      value={value}
      onValueChange={setValue}
    />
  );
}
