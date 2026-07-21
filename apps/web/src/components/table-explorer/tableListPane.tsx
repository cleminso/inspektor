import { Accordion, ActionList, Box, Search, SidePanel, Text } from "@inspector/ds";
import { Link } from "@tanstack/react-router";
import { EllipsisVertical, Table2 } from "lucide-react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { TableViewToggle } from "@/components/table-explorer/tableViewToggle";
import { appRoutes } from "@/lib/navigation/appRoutes";

export interface TableCheckedChangeOptions {
  extendRange: boolean;
  orderedTableNames: readonly string[];
}

interface TableListPaneProps {
  checkedTableNames: ReadonlySet<string>;
  searchValue: string;
  selectedTableName: string | null;
  tables: string[];
  onClearSelection: () => void;
  onSearchValueChange: (value: string) => void;
  onTableCheckedChange: (
    tableName: string,
    checked: boolean,
    options: TableCheckedChangeOptions,
  ) => void;
}

function hasShiftKey(event: Event): boolean {
  return "shiftKey" in event && event.shiftKey === true;
}

export function TableListPane({
  checkedTableNames,
  searchValue,
  selectedTableName,
  tables,
  onClearSelection,
  onSearchValueChange,
  onTableCheckedChange,
}: TableListPaneProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const canBuildHref =
    currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null;
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const filteredTables =
    normalizedSearchValue.length === 0
      ? tables
      : tables.filter((tableName) => tableName.toLowerCase().includes(normalizedSearchValue));
  const hasCheckedTables = tables.some((tableName) => checkedTableNames.has(tableName));

  return (
    <SidePanel>
      <SidePanel.Header>
        <Search
          aria-label="Search tables"
          value={searchValue}
          onValueChange={onSearchValueChange}
          placeholder="Search"
          size="m"
          fullWidth
        />
      </SidePanel.Header>
      <SidePanel.Body>
        <Accordion defaultValue={["tables"]}>
          <Accordion.Item value="tables">
            <Accordion.Header>
              <Accordion.Trigger
                suffix={
                  <Text as="span" variant="caption" color="muted" tabularNums>
                    {tables.length}
                  </Text>
                }
              >
                TABLES
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <Box paddingTop="xxs" flexDirection="column">
                {tables.length === 0 ? (
                  <Box padding="m" flexDirection="column" gap="xs">
                    <Text variant="label">No tables</Text>
                    <Text variant="caption" color="muted">
                      No published tables found in this schema.
                    </Text>
                  </Box>
                ) : filteredTables.length === 0 ? (
                  <Box padding="m" flexDirection="column" gap="xs">
                    <Text variant="label">No results</Text>
                    <Text variant="caption" color="muted">
                      Try a different table search.
                    </Text>
                  </Box>
                ) : (
                  <ActionList
                    aria-label="Tables"
                    onEscapeKeyDown={(event) => {
                      if (hasCheckedTables === false) {
                        return;
                      }

                      onClearSelection();
                      event.preventDefault();
                    }}
                  >
                    {filteredTables.map((tableName) => {
                      const isActive = selectedTableName === tableName;
                      const isChecked = checkedTableNames.has(tableName);
                      const tableParams =
                        canBuildHref === true
                          ? {
                              connectionId: currentConnectionId,
                              branch: currentBranch,
                              schemaHash: currentSchemaHash,
                              tableName,
                            }
                          : null;

                      if (tableParams === null) {
                        return (
                          <ActionList.Item
                            key={tableName}
                            active={isActive}
                            checked={isChecked}
                          >
                            <ActionList.SelectionControl
                              aria-label={`Select ${tableName}`}
                              checked={isChecked}
                              icon={<Table2 size={14} />}
                              onCheckedChange={(checked, eventDetails) => {
                                onTableCheckedChange(tableName, checked === true, {
                                  extendRange: hasShiftKey(eventDetails.event),
                                  orderedTableNames: filteredTables,
                                });
                              }}
                            />
                            <ActionList.Trigger disabled>
                              {tableName}
                            </ActionList.Trigger>
                          </ActionList.Item>
                        );
                      }

                      return (
                        <ActionList.Item
                          key={tableName}
                          active={isActive}
                          checked={isChecked}
                        >
                          <ActionList.SelectionControl
                            aria-label={`Select ${tableName}`}
                            checked={isChecked}
                            icon={<Table2 size={14} />}
                            onCheckedChange={(checked, eventDetails) => {
                              onTableCheckedChange(tableName, checked === true, {
                                extendRange: hasShiftKey(eventDetails.event),
                                orderedTableNames: filteredTables,
                              });
                            }}
                          />
                          <ActionList.Trigger
                            render={
                              <Link
                                to={appRoutes.table}
                                params={tableParams}
                                search={(currentSearch) => ({
                                  ...currentSearch,
                                  mode: undefined,
                                  rowId: undefined,
                                })}
                                aria-current={isActive === true ? "page" : undefined}
                              />
                            }
                          >
                            {tableName}
                          </ActionList.Trigger>
                          {isActive === true ? (
                            <ActionList.Action
                              aria-label={`Open actions for ${tableName}`}
                              title={`Open actions for ${tableName}`}
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                              }}
                            >
                              <EllipsisVertical aria-hidden="true" size={14} />
                            </ActionList.Action>
                          ) : null}
                        </ActionList.Item>
                      );
                    })}
                  </ActionList>
                )}
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </SidePanel.Body>
      <SidePanel.Footer>
        <TableViewToggle />
      </SidePanel.Footer>
    </SidePanel>
  );
}
