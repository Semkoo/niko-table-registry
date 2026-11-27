"use client"

import * as React from "react"
import {
  Copy,
  Loader2,
  PackageSearch,
  TriangleAlert,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from "@/components/niko-table/components/data-table-empty-state"
import {
  DataTableRowMenuScope,
  RowMenuItem,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridCheckboxCell } from "@/components/niko-table/grid/cells/grid-checkbox-cell"
import { GridDateCell } from "@/components/niko-table/grid/cells/grid-date-cell"
import { GridSelectCell } from "@/components/niko-table/grid/cells/grid-select-cell"
import {
  GridNumberCell,
  GridTextCell,
} from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { DataGridStatusBar } from "@/components/niko-table/grid/components/grid-status-bar"
import {
  DataGridAddRows,
  DataGridRedo,
  DataGridToolbar,
  DataGridUndo,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import {
  DataGridCell,
  useDataGridContext,
} from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import { useGridChanges } from "@/components/niko-table/grid/hooks/use-grid-changes"
import type { GridRow } from "@/components/niko-table/grid/types/grid-cell"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { categoryOptions, products } from "./inventory-data"
import {
  COLUMN_IDS,
  createEmptyRow,
  hasInvalidCell,
  isLowStock,
  rawOf,
  resolveCell,
  rowsEqual,
  summarize,
  toRow,
  usd,
  type ColumnId,
} from "./inventory-format"

type ChangeSet = { created: GridRow[]; updated: GridRow[]; deleted: string[] }

/** Pretend to POST the change set. Pass your own `persist` that calls your API; reject to fail. */
async function fakePersist(changeSet: ChangeSet) {
  void changeSet
  await new Promise(resolve => setTimeout(resolve, 600))
}

const INITIAL_ROWS = products.map(toRow)

// Every body row is 37px: the cell controls are h-9 (36px) plus the 1px row
// border. Keep in step if you change the cell height.
const ROW_HEIGHT = 37

const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

const COLUMNS: { id: ColumnId; label: string; width: number }[] = [
  { id: "sku", label: "SKU", width: 110 },
  { id: "name", label: "Product", width: 220 },
  { id: "category", label: "Category", width: 130 },
  { id: "price", label: "Price", width: 110 },
  { id: "stock", label: "In stock", width: 120 },
  { id: "reorderAt", label: "Reorder at", width: 120 },
  { id: "active", label: "Active", width: 90 },
  { id: "restockDate", label: "Restock date", width: 150 },
]

function ProductCell({
  id,
  label,
  ...p
}: CellEditorProps & { id: ColumnId; label: string }) {
  const resolve = (raw: string) => resolveCell(id, raw)
  switch (id) {
    case "category":
      return (
        <GridSelectCell
          {...p}
          options={categoryOptions}
          placeholder="Category"
          displayLabel={p.cell.value ?? undefined}
        />
      )
    case "price":
      return (
        <GridNumberCell
          {...p}
          resolve={resolve}
          placeholder={label}
          format={raw => usd.format(Number(raw))}
        />
      )
    case "stock":
    case "reorderAt":
      return <GridNumberCell {...p} resolve={resolve} placeholder={label} />
    case "active":
      return <GridCheckboxCell {...p} aria-label={label} />
    case "restockDate":
      return <GridDateCell {...p} placeholder="No date" />
    default:
      return <GridTextCell {...p} resolve={resolve} placeholder={label} />
  }
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `InventoryGrid` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function DuplicateItem({
  makeSku,
  announce,
}: {
  makeSku: () => string
  announce: (note: string) => void
}) {
  const row = useDataTableRow<GridRow>()
  const { grid } = useDataGridContext<GridRow>()
  return (
    <RowMenuItem
      disabled={grid.rows.length >= grid.maxRows}
      onClick={() => {
        const sku = makeSku()
        const name = rawOf(row, "name")
        const copy: GridRow = {
          ...row,
          id: sku,
          sku: resolveCell("sku", sku),
          name: resolveCell("name", name ? `${name} (copy)` : ""),
        }
        grid.updateRows(rows => {
          const at = rows.findIndex(r => r.id === row.id)
          const next = rows.slice()
          next.splice(at === -1 ? rows.length : at + 1, 0, copy)
          return next
        })
        announce(`Duplicated ${name} as ${sku}`)
      }}
    >
      <Copy className="size-4" />
      Duplicate
    </RowMenuItem>
  )
}

function DeleteItem({ announce }: { announce: (note: string) => void }) {
  const row = useDataTableRow<GridRow>()
  const { grid } = useDataGridContext<GridRow>()
  return (
    <RowMenuItem
      variant="destructive"
      // The grid always keeps one row.
      disabled={grid.rows.length <= 1}
      onClick={() => {
        grid.removeRow(row.id)
        announce(`Deleted ${rawOf(row, "name") || row.id}`)
      }}
    >
      <Trash2 className="size-4" />
      Delete product
    </RowMenuItem>
  )
}

function useInventoryColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<GridRow>[]>(
    () => [
      ...COLUMNS.map(({ id, label, width }): DataTableColumnDef<GridRow> => ({
        id,
        accessorFn: (row: GridRow) => rawOf(row, id),
        header: label,
        size: width,
        enableColumnFilter: id === "category",
        // Search matches name and SKU only, like the placeholder says.
        enableGlobalFilter: id === "name" || id === "sku",
        meta: {
          label,
          ...(id === "category" ? { options: categoryOptions } : {}),
        },
        cell: ctx =>
          id === "sku" ? (
            <span className="flex h-9 items-center px-2 font-mono text-xs text-muted-foreground">
              {rawOf(ctx.row.original, "sku")}
            </span>
          ) : (
            <DataGridCell row={ctx.row.original} columnId={id}>
              {(p: CellEditorProps) =>
                id === "stock" ? (
                  <div className="relative">
                    <ProductCell id={id} label={label} {...p} />
                    {isLowStock(ctx.row.original) ? (
                      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-warning">
                        <TriangleAlert
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Low stock</span>
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <ProductCell id={id} label={label} {...p} />
                )
              }
            </DataGridCell>
          ),
      })),
      {
        id: "actions",
        size: 56,
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for ${row.original.id}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DataTableRowMenuScope row={row.original} surface="dropdown">
                  {rowMenu}
                </DataTableRowMenuScope>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [rowMenu],
  )
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          warn && "text-warning",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export default function InventoryGrid({
  persist = fakePersist,
}: {
  persist?: (changeSet: ChangeSet) => Promise<void>
}) {
  const skuCounter = React.useRef(0)
  const makeSku = React.useCallback(
    () => `NEW-${String(++skuCounter.current).padStart(3, "0")}`,
    [],
  )
  const grid = useDataGrid<GridRow>({
    // SKU is left out so it is a plain, read-only table cell: navigation,
    // paste, fill and clear all skip it.
    columnIds: COLUMN_IDS.filter(id => id !== "sku"),
    createEmptyRow,
    initialRows: INITIAL_ROWS,
    makeId: makeSku,
  })
  const changes = useGridChanges(grid, {
    initialRows: INITIAL_ROWS,
    isEqual: rowsEqual,
  })
  const [saving, setSaving] = React.useState(false)
  const [note, setNote] = React.useState("")
  // What "Discard" goes back to: the seed, then the rows as of the last save.
  const baseline = React.useRef<GridRow[]>(INITIAL_ROWS)

  const summary = React.useMemo(() => summarize(grid.rows), [grid.rows])
  const invalidCells = React.useMemo(
    () =>
      grid.rows.reduce(
        (sum, row) =>
          sum +
          (hasInvalidCell(row)
            ? COLUMN_IDS.filter(id => {
                const cell = row[id]
                return typeof cell === "object" && cell.status === "invalid"
              }).length
            : 0),
        0,
      ),
    [grid.rows],
  )
  const unsaved = React.useMemo(() => {
    const { created, updated, deleted } = changes.getChangeSet()
    return created.length + updated.length + deleted.length
    // `changes` also changes whenever the dirty set does.
  }, [changes, grid.rows]) // eslint-disable-line react-hooks/exhaustive-deps

  const containerRef = React.useRef<HTMLDivElement>(null)

  const onSave = React.useCallback(async () => {
    const { created, updated, deleted } = changes.getChangeSet()
    const count = created.length + updated.length + deleted.length
    setSaving(true)
    setNote(`Saving ${count} ${count === 1 ? "change" : "changes"}…`)
    try {
      await persist({ created, updated, deleted })
      // The server now holds exactly what was sent. Make that the baseline and
      // let the grid re-compare: anything changed, undone or edited while
      // saving shows up as an unsaved change again.
      const sent = new Map(baseline.current.map(row => [row.id, row]))
      for (const row of [...created, ...updated]) sent.set(row.id, row)
      for (const id of deleted) sent.delete(id)
      baseline.current = [...sent.values()]
      changes.reset(baseline.current)
      // `reset` clears dirty state; a no-history commit with fresh row objects
      // makes the hook re-derive it from the current rows.
      grid.updateRows(rows => rows.map(row => ({ ...row })), {
        history: false,
      })
      setNote(`Saved ${count} ${count === 1 ? "change" : "changes"}`)
    } catch {
      // Nothing was reconciled, so every change stays unsaved.
      setNote("Save failed. Your changes are still here.")
    } finally {
      setSaving(false)
    }
  }, [changes, grid, persist])

  // The Save button unmounts when the bar clears; keep focus in the grid.
  const wasSaving = React.useRef(false)
  React.useEffect(() => {
    if (wasSaving.current && !saving) {
      const active = document.activeElement
      if (!active || active === document.body) {
        containerRef.current
          ?.querySelector<HTMLElement>('[role="grid"]')
          ?.focus()
      }
    }
    wasSaving.current = saving
  }, [saving])

  const onDiscard = React.useCallback(() => {
    grid.updateRows(() => baseline.current)
    setNote("Discarded unsaved changes")
  }, [grid])

  const rowMenu = React.useMemo(
    () => (
      <>
        <DuplicateItem makeSku={makeSku} announce={setNote} />
        <DeleteItem announce={setNote} />
      </>
    ),
    [makeSku],
  )
  const columns = useInventoryColumns(rowMenu)

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
    >
      <DataTableRoot
        data={grid.rows}
        columns={columns}
        getRowId={row => row.id}
      >
        <DataGrid grid={grid} className="flex flex-col gap-4 outline-none">
          <DataTableColumnResize />
          <DataGridClipboard resolveCell={resolveCell} />
          <DataGridFillHandle />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-base font-semibold">Inventory</h2>
            <div className="flex gap-6">
              <Stat label="Products" value={String(summary.products)} />
              <Stat
                label="Low stock"
                value={String(summary.lowStock)}
                warn={summary.lowStock > 0}
              />
              <Stat
                label="Inventory value"
                value={usd.format(summary.cents / 100)}
              />
            </div>
          </div>
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search by name or SKU..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="category" multiple />
            <DataTableClearFilter />
            <DataGridToolbar className="ml-auto">
              <DataGridUndo />
              <DataGridRedo />
              <DataGridAddRows count={1} label="Add product" />
            </DataGridToolbar>
          </DataTableToolbarSection>
          {unsaved > 0 ? (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {unsaved} unsaved {unsaved === 1 ? "change" : "changes"}
              </span>
              {invalidCells > 0 ? (
                <span className="text-sm text-destructive">
                  Fix {invalidCells} invalid{" "}
                  {invalidCells === 1 ? "cell" : "cells"} to save
                </span>
              ) : null}
              <div className="ml-auto flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDiscard}
                  disabled={saving}
                >
                  Discard
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={saving || invalidCells > 0 || unsaved === 0}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : null}
          <DataTable maxHeight={520}>
            <DataTableVirtualizedHeader />
            <DataTableVirtualizedBody<GridRow>
              estimateSize={ROW_HEIGHT}
              fixedRowHeight
              getCellClassName={gridCellClassName}
            >
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableVirtualizedEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <PackageSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No products yet</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Add a product to get started.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <PackageSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>
                    No matching products
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try another search, or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableVirtualizedEmptyBody>
            </DataTableVirtualizedBody>
          </DataTable>
          <DataGridStatusBar />
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {note}
          </p>
        </DataGrid>
      </DataTableRoot>
    </div>
  )
}
