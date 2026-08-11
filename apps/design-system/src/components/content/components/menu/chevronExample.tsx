import { Button, Menu } from "@inspector/ds";
import { ChevronDown } from "lucide-react";
import { type ReactElement } from "react";

export default function ChevronExample(): ReactElement {
  return (
    <Menu.Root>
      <Menu.Trigger
        render={<Button variant="secondary" suffix={<Button.Glyph artwork={ChevronDown} />} />}
      >
        View
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onClick={() => undefined}>Table</Menu.Item>
        <Menu.Item onClick={() => undefined}>Cards</Menu.Item>
        <Menu.Item onClick={() => undefined}>Timeline</Menu.Item>
      </Menu.Content>
    </Menu.Root>
  );
}
