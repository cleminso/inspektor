import { ContextSwitcher, Text } from "@inspector/ds";
import { HashIcon } from "lucide-react";
import { type ReactElement, useState } from "react";

const schemaHashes = [
  "cfef3020bf6c11bb9ccba02f418daa7c70323bc1b59252abda83e250445915ea",
  "7a41311ef30ac2d93895f181e6f58239de54738dff78ab671123bc76acd8e157",
];

function truncateMiddle(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-11)}`;
}

export default function StatusExample(): ReactElement {
  const [schemaHash, setSchemaHash] = useState<string | null>(schemaHashes[0] ?? null);

  return (
    <ContextSwitcher.Root items={schemaHashes} value={schemaHash} onValueChange={setSchemaHash}>
      <ContextSwitcher.Trigger label="Switch schema" title={schemaHash ?? undefined} width="m">
        <HashIcon aria-hidden="true" size={14} />
        <Text as="span" color="inherit" monospace truncate>
          {schemaHash === null ? "Select schema" : truncateMiddle(schemaHash)}
        </Text>
      </ContextSwitcher.Trigger>
      <ContextSwitcher.Popup width="content">
        <ContextSwitcher.Search label="Search schemas" placeholder="Search schemas" />
        <ContextSwitcher.Content>
          <ContextSwitcher.Empty>No schemas available.</ContextSwitcher.Empty>
          <ContextSwitcher.List>
            {(hash: string) => (
              <ContextSwitcher.Item key={hash} value={hash}>
                <Text as="span" color="inherit" monospace>
                  {hash}
                </Text>
              </ContextSwitcher.Item>
            )}
          </ContextSwitcher.List>
        </ContextSwitcher.Content>
      </ContextSwitcher.Popup>
    </ContextSwitcher.Root>
  );
}
