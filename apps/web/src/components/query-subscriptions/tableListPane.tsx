import { Accordion, ActionList, Box, Checkbox, Search, SidePanel, Text } from "@inspector/ds";
import { Table2 } from "lucide-react";

import type { QuerySubscriptionPropagation } from "@/types/querySubscriptions";

interface QuerySubscriptionsListPaneProps {
  searchValue: string;
  selectedPropagations: QuerySubscriptionPropagation[];
  selectedTableName: string | null;
  tableCount: number;
  visibleTableNames: string[];
  onPropagationSelectedChange: (
    propagation: QuerySubscriptionPropagation,
    selected: boolean,
  ) => void;
  onSearchValueChange: (value: string) => void;
  onSelectedTableNameChange: (value: string | null) => void;
}

export function QuerySubscriptionsListPane({
  searchValue,
  selectedPropagations,
  selectedTableName,
  tableCount,
  visibleTableNames,
  onPropagationSelectedChange,
  onSearchValueChange,
  onSelectedTableNameChange,
}: QuerySubscriptionsListPaneProps): React.ReactElement {
  return (
    <SidePanel>
      <SidePanel.Header>
        <Search
          aria-label="Search query subscriptions tables"
          value={searchValue}
          onValueChange={onSearchValueChange}
          placeholder="Search"
          size="m"
          fullWidth
        />
      </SidePanel.Header>
      <SidePanel.Body>
        <Accordion multiple defaultValue={["tables", "propagation"]}>
          <Accordion.Item value="tables">
            <Accordion.Header>
              <Accordion.Trigger
                suffix={
                  <Text as="span" variant="caption" color="muted" tabularNums>
                    {tableCount}
                  </Text>
                }
              >
                TABLES
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <Box paddingTop="xxs" flexDirection="column">
                <ActionList aria-label="Subscription tables">
                  <ActionList.Item active={selectedTableName === null}>
                    <ActionList.Trigger
                      prefix={<Table2 size={14} />}
                      aria-pressed={selectedTableName === null}
                      onClick={() => {
                        onSelectedTableNameChange(null);
                      }}
                    >
                      All
                    </ActionList.Trigger>
                  </ActionList.Item>
                  {visibleTableNames.map((tableName) => {
                    const isActive = selectedTableName === tableName;

                    return (
                      <ActionList.Item key={tableName} active={isActive}>
                        <ActionList.Trigger
                          prefix={<Table2 size={14} />}
                          aria-pressed={isActive}
                          onClick={() => {
                            onSelectedTableNameChange(tableName);
                          }}
                        >
                          {tableName}
                        </ActionList.Trigger>
                      </ActionList.Item>
                    );
                  })}
                </ActionList>
                {visibleTableNames.length === 0 && tableCount > 0 ? (
                  <Box padding="m">
                    <Text variant="caption" color="muted">
                      No matching tables.
                    </Text>
                  </Box>
                ) : null}
              </Box>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="propagation">
            <Accordion.Header>
              <Accordion.Trigger>PROPAGATION</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <Box width="full" flexDirection="column" gap="s" paddingHorizontal="s">
                {(["full", "local-only"] as const).map((propagation) => (
                  <Box
                    as="label"
                    key={propagation}
                    display="flex"
                    alignItems="center"
                    paddingHorizontal="m"
                    gap="s"
                  >
                    <Checkbox
                      size="s"
                      checked={selectedPropagations.includes(propagation)}
                      onCheckedChange={(checked) => {
                        onPropagationSelectedChange(propagation, checked === true);
                      }}
                    />
                    <Text as="span">{propagation === "full" ? "Full" : "Local-only"}</Text>
                  </Box>
                ))}
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </SidePanel.Body>
    </SidePanel>
  );
}
