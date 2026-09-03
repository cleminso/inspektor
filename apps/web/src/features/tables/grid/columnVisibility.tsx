import type { DynamicTableRow } from 'jazz-tools'
import { Settings2 } from 'lucide-react'

import {
  Button,
  MultiSelect,
  Tooltip,
  type DataGridTable,
  type MultiSelectItem,
} from '@inspector/ds'

import { tableGridSelectionColumnId } from '@tables/grid/tableGridColumnIds'

interface DataGridColumnVisibilityProps {
  table: DataGridTable<DynamicTableRow>
}

export function DataGridColumnVisibility({
  table,
}: DataGridColumnVisibilityProps): React.ReactElement {
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.id !== tableGridSelectionColumnId)
  const items: readonly MultiSelectItem[] = columns.map((column) => ({
    disabled: column.getCanHide() === false,
    label: column.id,
    value: column.id,
  }))
  const visibleColumnIds = columns
    .filter((column) => column.getIsVisible() === true)
    .map((column) => column.id)
  const hasHiddenColumns = visibleColumnIds.length < columns.length

  return (
    <MultiSelect.Root
      items={items}
      value={visibleColumnIds}
      onValueChange={(nextVisibleColumnIds) => {
        const nextVisibleColumnIdSet = new Set(nextVisibleColumnIds)
        table.setColumnVisibility(
          Object.fromEntries(
            columns.map((column) => [
              column.id,
              column.getCanHide() === false || nextVisibleColumnIdSet.has(column.id),
            ]),
          ),
        )
      }}
    >
      <Tooltip.Root>
        <Tooltip.Trigger
          render={
            <MultiSelect.Trigger
              label="Choose visible columns"
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="s"
                  aria-label="Choose visible columns"
                  aria-pressed={hasHiddenColumns}
                  iconOnly
                />
              }
            >
              <Button.Glyph artwork={Settings2} />
            </MultiSelect.Trigger>
          }
        />
        <Tooltip.Content>Columns visibility</Tooltip.Content>
      </Tooltip.Root>
      <MultiSelect.Content
        align="end"
        label="Visible columns"
      />
    </MultiSelect.Root>
  )
}
