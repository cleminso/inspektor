import { SegmentedControl, Text } from "@inspector/ds";
import { type ReactElement } from "react";

export default function BasicExample(): ReactElement {
  return (
    <SegmentedControl defaultValue="details">
      <SegmentedControl.List aria-label="Row representation" width="full">
        <SegmentedControl.Item value="details">Details</SegmentedControl.Item>
        <SegmentedControl.Item value="json">JSON</SegmentedControl.Item>
      </SegmentedControl.List>
      <SegmentedControl.Panel value="details">
        <Text>Editable fields for the selected row.</Text>
      </SegmentedControl.Panel>
      <SegmentedControl.Panel value="json">
        <Text>Read-only JSON for the same selected row.</Text>
      </SegmentedControl.Panel>
    </SegmentedControl>
  );
}
