import { Combobox } from "@inspector/ds";
import { type ReactElement, useState } from "react";

const schemaHashes = [
  "cfef3020bf6c11bb9ccba02f418daa7c70323bc1b59252abda83e250445915ea",
  "7a41311ef30ac2d93895f181e6f58239de54738dff78ab671123bc76acd8e157",
];

function truncateMiddle(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-11)}`;
}

export default function ContentWidthExample(): ReactElement {
  const [schemaHash, setSchemaHash] = useState<string | null>(schemaHashes[0] ?? null);

  return (
    <Combobox.Root items={schemaHashes} value={schemaHash} onValueChange={setSchemaHash}>
      <Combobox.Trigger aria-label="Switch schema">
        {schemaHash === null ? "Select schema" : truncateMiddle(schemaHash)}
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup width="content" aria-label="Schemas">
            <Combobox.PopupHeader>
              <Combobox.InputGroup>
                <Combobox.Input aria-label="Search schemas" placeholder="Search schemas" />
              </Combobox.InputGroup>
            </Combobox.PopupHeader>
            <Combobox.Separator />
            <Combobox.Viewport maxHeight="m">
            <Combobox.List>
              {(hash: string) => (
                <Combobox.Item key={hash} value={hash}>
                  <Combobox.ItemText label={hash} />
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              )}
              </Combobox.List>
            </Combobox.Viewport>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
