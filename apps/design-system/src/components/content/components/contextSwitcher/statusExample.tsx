import { Box, Button, ContextSwitcher, Spinner, Text } from "@inspector/ds";
import { HashIcon } from "lucide-react";
import { type ReactElement, useState } from "react";

type ResultState = "ready" | "loading" | "empty" | "error";

interface Schema {
  hash: string;
  status: "Current" | "Available";
}

const schemas: Schema[] = [
  {
    hash: "cfef3020bf6c11bb9ccba02f418daa7c70323bc1b59252abda83e250445915ea",
    status: "Current",
  },
  {
    hash: "7a41311ef30ac2d93895f181e6f58239de54738dff78ab671123bc76acd8e157",
    status: "Available",
  },
];

const resultStateLabels = {
  ready: "Ready",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
} satisfies Record<ResultState, string>;

function truncateMiddle(value: string): string {
  return `${value.slice(0, 12)}...${value.slice(-11)}`;
}

export default function StatusExample(): ReactElement {
  const [resultState, setResultState] = useState<ResultState>("ready");
  const [schema, setSchema] = useState<Schema | null>(schemas[0] ?? null);
  const items = resultState === "ready" ? schemas : [];

  return (
    <Box flexDirection="column" gap="l" alignItems="start">
      <Box gap="s" flexWrap="wrap">
        {(["ready", "loading", "empty", "error"] as const).map((state) => (
          <Button
            key={state}
            size="s"
            variant={resultState === state ? "secondary" : "ghost"}
            aria-pressed={resultState === state}
            onClick={() => setResultState(state)}
          >
            {resultStateLabels[state]}
          </Button>
        ))}
      </Box>

      <ContextSwitcher.Root
        items={items}
        value={schema}
        onValueChange={setSchema}
        itemToStringLabel={(item) => item.hash}
        itemToStringValue={(item) => item.hash}
        isItemEqualToValue={(item, selected) => item.hash === selected.hash}
      >
        <ContextSwitcher.Trigger label="Switch schema" title={schema?.hash} width="m">
          <HashIcon aria-hidden="true" size={14} />
          <Text as="span" color="inherit" monospace truncate>
            {schema === null ? "Select schema" : truncateMiddle(schema.hash)}
          </Text>
        </ContextSwitcher.Trigger>
        <ContextSwitcher.Content width="content">
          <ContextSwitcher.Search label="Search schemas" placeholder="Search schema hashes" />
          <ContextSwitcher.Viewport>
            <ContextSwitcher.Status>
              {resultState === "loading" ? (
                <Box alignItems="center" gap="s">
                  <Spinner size="s" />
                  Loading schemas
                </Box>
              ) : resultState === "error" ? (
                "Could not load schemas."
              ) : null}
            </ContextSwitcher.Status>
            <ContextSwitcher.Empty>
              {resultState === "empty" ? "No schemas are available." : null}
            </ContextSwitcher.Empty>
            <ContextSwitcher.List>
              {(item: Schema) => (
                <ContextSwitcher.Item key={item.hash} value={item}>
                  <ContextSwitcher.ItemText
                    label={
                      <Text as="span" color="inherit" monospace>
                        {item.hash}
                      </Text>
                    }
                  />
                </ContextSwitcher.Item>
              )}
            </ContextSwitcher.List>
          </ContextSwitcher.Viewport>
        </ContextSwitcher.Content>
      </ContextSwitcher.Root>
    </Box>
  );
}
