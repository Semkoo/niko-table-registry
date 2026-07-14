"use client"

/**
 * niko-table/grid — dynamic columns (opt-in).
 *
 * `useGridColumns` makes the columns runtime STATE; `<DataGridColumns>` wires
 * the header menu (Rename / Insert left|right / Move / Delete) + the add-column
 * button, and `<DataTableViewDndMenu>` drives show/hide + drag-to-reorder from
 * the same column order. Add / delete / reorder need zero engine or row changes
 * — a missing cell value just renders empty. A fixed-column grid omits this
 * whole block.
 */
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnHideOptions } from "@/components/niko-table/components/data-table-column-hide"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTableViewDndMenu } from "@/components/niko-table/components/data-table-view-dnd-menu"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridAddColumnButton } from "@/components/niko-table/grid/components/grid-add-column"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { GridColumnMenuOptions } from "@/components/niko-table/grid/components/grid-column-menu"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridColumns } from "@/components/niko-table/grid/core/data-grid-columns-context"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import {
  useGridColumns,
  type GridColumnSpec,
} from "@/components/niko-table/grid/hooks/use-grid-columns"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import * as React from "react"

const INITIAL_COLUMNS: GridColumnSpec[] = [
  { id: "feature", label: "Feature", type: "text", width: 200 },
  { id: "owner", label: "Owner", type: "text", width: 160 },
  { id: "status", label: "Status", type: "text", width: 160 },
]

const resolveCell = (_columnId: string, raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw === "" ? "empty" : "valid",
})

const c = (raw: string) => resolveCell("", raw)
const INITIAL_ROWS: GridRow[] = [
  { id: "r1", feature: c("Clipboard"), owner: c("Bailey"), status: c("Done") },
  {
    id: "r2",
    feature: c("Fill handle"),
    owner: c("Noah"),
    status: c("In review"),
  },
  {
    id: "r3",
    feature: c("Dynamic columns"),
    owner: c("Mia"),
    status: c("Building"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })
const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

export function GridDynamicColumns() {
  const cols = useGridColumns({ initialColumns: INITIAL_COLUMNS })
  const grid = useDataGrid<GridRow>({
    columnIds: cols.columnIds,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      cols.columns.map(col => ({
        id: col.id,
        accessorFn: (row: GridRow) => {
          const v = row[col.id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
            <DataTableColumnActions>
              <DataTableColumnHideOptions />
              {/* Rename / Insert left|right / Move / Delete */}
              <GridColumnMenuOptions />
            </DataTableColumnActions>
          </DataTableColumnHeader>
        ),
        size: col.width,
        meta: { label: col.label },
        cell: ctx => (
          <DataGridCell
            row={ctx.row.original}
            columnId={col.id}
            displayIndex={ctx.row.index}
          >
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(col.id, raw)}
                placeholder={col.label}
              />
            )}
          </DataGridCell>
        ),
      })),
    [cols.columns],
  )

  return (
    <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
      <DataGrid grid={grid}>
        <DataGridClipboard resolveCell={resolveCell} />
        <DataGridColumns value={cols}>
          <DataGridToolbar>
            <DataGridAddRows count={3} />
            <DataGridAddColumnButton />
            <DataTableViewDndMenu
              columnOrder={cols.columnIds}
              onColumnOrderChange={cols.reorderColumns}
            />
          </DataGridToolbar>
          <DataTable maxHeight={360}>
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<GridRow>
              estimateSize={37}
              fixedRowHeight
              getCellClassName={gridCellClassName}
            >
              <DataTableRowContextMenuSlot>
                <GridRowMenu />
              </DataTableRowContextMenuSlot>
            </DataTableVirtualizedBody>
          </DataTable>
        </DataGridColumns>
      </DataGrid>
    </DataTableRoot>
  )
}
