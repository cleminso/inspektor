import { Accordion, ActionList, Box, ContextMenu, Search, SidePanel, Text } from "@inspector/ds";
import { Link } from "@tanstack/react-router";
import { Table2 } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

import { useInspector } from "@/components/providers/inspectorProvider";
import { useTableTabs } from "@/components/table-explorer/tableTabsProvider";
import { TableViewToggle } from "@/components/table-explorer/tableViewToggle";
import { appRoutes } from "@/lib/navigation/appRoutes";

export type TableListSection = "pinned" | "tables";

export interface TableCheckedChangeOptions {
  extendRange: boolean;
  orderedTableNames: readonly string[];
  section: TableListSection;
}

interface TableListPaneProps {
  checkedTableNames: ReadonlySet<string>;
  pinnedTableNames: ReadonlySet<string>;
  searchValue: string;
  selectedTableName: string | null;
  tables: string[];
  onClearSelection: () => void;
  onOpenTables: (orderedTableNames: readonly string[]) => void;
  onPinTables: (tableNames: readonly string[]) => void;
  onReplaceSelection: (tableName: string, section: TableListSection) => void;
  onSearchValueChange: (value: string) => void;
  onTableCheckedChange: (
    tableName: string,
    checked: boolean,
    options: TableCheckedChangeOptions,
  ) => void;
  onUnpinTables: (tableNames: readonly string[]) => void;
}

function hasShiftKey(event: Event): boolean {
  return "shiftKey" in event && event.shiftKey === true;
}

function getActionLabel(action: "Open" | "Pin" | "Unpin", count: number): string {
  return `${action} ${count} ${count === 1 ? "table" : "tables"}`;
}

function isTableSelectionInteraction(target: EventTarget | null): boolean {
  if (target instanceof Element === false) {
    return false;
  }

  if (target.closest('[data-slot="context-menu-popup"]') !== null) {
    return true;
  }

  const actionList = target.closest('[data-slot="action-list"]');
  const label = actionList?.getAttribute("aria-label");
  return label === "Pinned tables" || label === "Tables";
}

export function TableListPane({
  checkedTableNames,
  pinnedTableNames,
  searchValue,
  selectedTableName,
  tables,
  onClearSelection,
  onOpenTables,
  onPinTables,
  onReplaceSelection,
  onSearchValueChange,
  onTableCheckedChange,
  onUnpinTables,
}: TableListPaneProps): React.ReactElement {
  const { currentBranch, currentConnectionId, currentSchemaHash } = useInspector();
  const { getBaseTabSearch } = useTableTabs();
  const canBuildHref =
    currentConnectionId !== null && currentBranch !== null && currentSchemaHash !== null;
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const pinnedTables = tables.filter((tableName) => pinnedTableNames.has(tableName));
  const unpinnedTables = tables.filter((tableName) => pinnedTableNames.has(tableName) === false);
  const filterTables = (sectionTables: readonly string[]) =>
    normalizedSearchValue.length === 0
      ? sectionTables
      : sectionTables.filter((tableName) =>
          tableName.toLowerCase().includes(normalizedSearchValue),
        );
  const filteredPinnedTables = filterTables(pinnedTables);
  const filteredUnpinnedTables = filterTables(unpinnedTables);
  const hasCheckedTables = checkedTableNames.size > 0;
  const clearSelection = useEffectEvent(onClearSelection);

  useEffect(() => {
    if (hasCheckedTables === false) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (isTableSelectionInteraction(event.target) === false) {
        clearSelection();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [hasCheckedTables]);

  const renderTableList = (
    section: TableListSection,
    sectionTables: readonly string[],
  ): React.ReactElement => {
    const orderedCheckedTableNames = sectionTables.filter((tableName) =>
      checkedTableNames.has(tableName),
    );

    return (
      <ActionList
        aria-label={section === "pinned" ? "Pinned tables" : "Tables"}
        onEscapeKeyDown={(event) => {
          if (hasCheckedTables === false) {
            return;
          }

          onClearSelection();
          event.preventDefault();
        }}
      >
        {sectionTables.map((tableName) => {
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
          const handleContextMenu = () => {
            if (isChecked === false) {
              onReplaceSelection(tableName, section);
            }
          };
          const changeChecked = (checked: boolean, event: Event) => {
            onTableCheckedChange(tableName, checked, {
              extendRange: hasShiftKey(event),
              orderedTableNames: sectionTables,
              section,
            });
          };
          const trigger =
            tableParams === null ? (
              <ActionList.Trigger disabled onContextMenu={handleContextMenu}>
                {tableName}
              </ActionList.Trigger>
            ) : hasCheckedTables === true ? (
              <ActionList.Trigger
                onClick={(event) => {
                  changeChecked(isChecked === false, event.nativeEvent);
                }}
                onContextMenu={handleContextMenu}
              >
                {tableName}
              </ActionList.Trigger>
            ) : (
              <ActionList.Trigger
                nativeButton={false}
                render={
                  <Link
                    to={appRoutes.table}
                    params={tableParams}
                    search={getBaseTabSearch(tableName)}
                    aria-current={isActive === true ? "page" : undefined}
                  />
                }
                onContextMenu={handleContextMenu}
              >
                {tableName}
              </ActionList.Trigger>
            );

          return (
            <ContextMenu.Root key={tableName}>
              <ActionList.Item active={isActive} checked={isChecked}>
                <ActionList.SelectionControl
                  aria-label={`Select ${tableName}`}
                  checked={isChecked}
                  icon={<Table2 size={14} />}
                  onCheckedChange={(checked, eventDetails) => {
                    changeChecked(checked === true, eventDetails.event);
                  }}
                />
                <ContextMenu.Trigger render={trigger} />
              </ActionList.Item>
              <ContextMenu.Content>
                <ContextMenu.Item onClick={() => onOpenTables(orderedCheckedTableNames)}>
                  {getActionLabel("Open", orderedCheckedTableNames.length)}
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item
                  onClick={() => {
                    if (section === "pinned") {
                      onUnpinTables(orderedCheckedTableNames);
                    } else {
                      onPinTables(orderedCheckedTableNames);
                    }
                  }}
                >
                  {getActionLabel(
                    section === "pinned" ? "Unpin" : "Pin",
                    orderedCheckedTableNames.length,
                  )}
                </ContextMenu.Item>
                <ContextMenu.Separator />
                <ContextMenu.Item variant="danger" onClick={onClearSelection}>
                  Deselect all
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Root>
          );
        })}
      </ActionList>
    );
  };

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
        <Accordion defaultValue={["pinned", "tables"]} multiple>
          {pinnedTables.length > 0 ? (
            <Accordion.Item value="pinned">
              <Accordion.Header>
                <Accordion.Trigger
                  suffix={
                    <Text as="span" variant="caption" color="muted" tabularNums>
                      {pinnedTables.length}
                    </Text>
                  }
                >
                  PINNED
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <Box paddingTop="xxs" flexDirection="column">
                  {renderTableList("pinned", filteredPinnedTables)}
                </Box>
              </Accordion.Panel>
            </Accordion.Item>
          ) : null}
          <Accordion.Item value="tables">
            <Accordion.Header>
              <Accordion.Trigger
                suffix={
                  <Text as="span" variant="caption" color="muted" tabularNums>
                    {unpinnedTables.length}
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
                ) : filteredPinnedTables.length === 0 &&
                  filteredUnpinnedTables.length === 0 ? (
                  <Box padding="m" flexDirection="column" gap="xs">
                    <Text variant="label">No results</Text>
                    <Text variant="caption" color="muted">
                      Try a different table search.
                    </Text>
                  </Box>
                ) : (
                  renderTableList("tables", filteredUnpinnedTables)
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
