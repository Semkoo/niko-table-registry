"use client"

/**
 * niko-table/grid — writing your own PORTALED cell editor.
 *
 * A custom "color swatch" cell that opens a Popover palette. It shows the two
 * things every portaled editor needs:
 *
 *   1. The display / editor split — a cheap `GridCellDisplay` shell renders for
 *      every visible cell; the Popover mounts ONLY for the cell being edited.
 *   2. `data-grid-cell-editor` on the portaled surface — the palette renders
 *      outside the cell's DOM (in a portal), but React events still bubble
 *      through the React tree to the grid. Tagging the `PopoverContent` tells
 *      the grid's click-away / cell-mousedown guards to leave the editor
 *      mounted while a swatch is clicked. Without it, the mousedown would
 *      reselect the cell and unmount the editor before the click commits, so
 *      picking a color would silently no-op.
 *
 * The same contract (`CellEditorProps`) powers the built-in date / combobox
 * cells — a rating stepper, an emoji picker, or a multi-select drops in the
 * same way.
 */
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { cellTriggerClass } from "@/components/niko-table/grid/cells/cell-styles"
import { GridCellDisplay } from "@/components/niko-table/grid/cells/grid-cell-display"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import {
  DataGridAddRows,
  DataGridToolbar,
} from "@/components/niko-table/grid/components/grid-toolbar"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { cn } from "@/lib/utils"

// --- the palette -------------------------------------------------------------
const PALETTE = [
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Green", hex: "#22c55e" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Slate", hex: "#64748b" },
] as const
const HEX_BY_NAME = new Map<string, string>(PALETTE.map(c => [c.name, c.hex]))

// A picked color is stored by name; a value not in the palette reads invalid,
// so a bad paste stays visible (red) instead of being silently accepted.
function resolveColor(raw: string): CellState<string> {
  const trimmed = raw.trim()
  if (trimmed === "") return { raw, value: null, status: "empty" }
  return HEX_BY_NAME.has(trimmed)
    ? { raw, value: trimmed, status: "valid" }
    : {
        raw,
        value: null,
        status: "invalid",
        error: `Unknown color "${trimmed}"`,
      }
}

const resolveText = (raw: string): CellState<string> => {
  const v = raw.trim()
  return { raw, value: v || null, status: v ? "valid" : "empty" }
}

// --- the custom portaled cell ------------------------------------------------
function ColorDot({ name }: { name: string }) {
  return (
    <span
      className="size-3 shrink-0 rounded-full border"
      style={{ backgroundColor: HEX_BY_NAME.get(name) }}
    />
  )
}

function SwatchCell(props: CellEditorProps) {
  const { cell, isFocused, isSelected, isEditing } = props

  // Display shell — renders for every visible cell (cheap, no popover).
  if (!isEditing) {
    return (
      <GridCellDisplay
        status={cell.status}
        error={cell.error}
        isFocused={isFocused}
        isSelected={isSelected}
      >
        {cell.value ? (
          <span className="flex items-center gap-2">
            <ColorDot name={cell.value} />
            {cell.value}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {cell.raw || "Pick a color"}
          </span>
        )}
      </GridCellDisplay>
    )
  }
  return <SwatchEditor {...props} />
}

// The open palette — mounted ONLY while this one cell is being edited.
function SwatchEditor({
  cell,
  isSelected,
  onCommit,
  onEditingChange,
}: CellEditorProps) {
  return (
    <Popover
      open
      onOpenChange={open => {
        // Click-away / Escape closes the popover → leave edit mode.
        if (!open) onEditingChange(false)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-invalid={cell.status === "invalid"}
          className={cn(
            cellTriggerClass({
              status: cell.status,
              isFocused: true,
              isSelected,
              isEmpty: cell.status === "empty",
            }),
            "gap-2",
          )}
        >
          {cell.value ? (
            <>
              <ColorDot name={cell.value} />
              <span className="flex-1 truncate text-left">{cell.value}</span>
            </>
          ) : (
            <span className="flex-1 truncate text-left text-muted-foreground">
              Pick a color
            </span>
          )}
        </Button>
      </PopoverTrigger>

      {/*
        THE KEY LINE. The palette portals out of the cell's DOM; `data-grid-cell-editor`
        tells the grid to ignore pointer events inside it, so clicking a swatch
        commits instead of unmounting the editor first.
      */}
      <PopoverContent
        data-grid-cell-editor=""
        align="start"
        className="w-auto p-2"
      >
        <div className="grid grid-cols-5 gap-1">
          {PALETTE.map(c => {
            const active = c.name === cell.value
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={active}
                onClick={() => {
                  onCommit({ raw: c.name, value: c.name, status: "valid" })
                  onEditingChange(false)
                }}
                className={cn(
                  "size-7 rounded-md border transition outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "ring-2 ring-ring ring-offset-1 ring-offset-background"
                    : "hover:scale-110",
                )}
                style={{ backgroundColor: c.hex }}
              />
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// --- the grid ----------------------------------------------------------------
const COLUMN_IDS = ["label", "color"] as const
const createEmptyRow = (id: string): GridRow => ({ id })
const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

const cell = (resolve: (raw: string) => CellState<string>, raw: string) =>
  resolve(raw)
const INITIAL_ROWS: GridRow[] = [
  {
    id: "r1",
    label: cell(resolveText, "Backlog"),
    color: cell(resolveColor, "Slate"),
  },
  {
    id: "r2",
    label: cell(resolveText, "In progress"),
    color: cell(resolveColor, "Blue"),
  },
  {
    id: "r3",
    label: cell(resolveText, "Blocked"),
    color: cell(resolveColor, "Red"),
  },
  {
    id: "r4",
    label: cell(resolveText, "Done"),
    color: cell(resolveColor, "Green"),
  },
]

const rawOf = (row: GridRow, id: string) => {
  const v = row[id]
  return typeof v === "object" && v != null ? v.raw : ""
}

export function GridPortaledCell() {
  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () => [
      {
        id: "label",
        accessorFn: (row: GridRow) => rawOf(row, "label"),
        header: "Label",
        size: 220,
        meta: { label: "Label" },
        cell: ctx => (
          <DataGridCell
            row={ctx.row.original}
            columnId="label"
            displayIndex={ctx.row.index}
          >
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={resolveText}
                placeholder="Status name"
              />
            )}
          </DataGridCell>
        ),
      },
      {
        id: "color",
        accessorFn: (row: GridRow) => rawOf(row, "color"),
        header: "Color",
        size: 200,
        meta: { label: "Color" },
        // The custom portaled cell — double-click or press Enter to open it.
        cell: ctx => (
          <DataGridCell
            row={ctx.row.original}
            columnId="color"
            displayIndex={ctx.row.index}
          >
            {(p: CellEditorProps) => <SwatchCell {...p} />}
          </DataGridCell>
        ),
      },
    ],
    [],
  )

  return (
    <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
      <DataGrid grid={grid}>
        <DataGridToolbar>
          <DataGridAddRows count={1} />
          <span className="ms-auto text-sm text-muted-foreground">
            Double-click a Color cell to open the palette.
          </span>
        </DataGridToolbar>
        <DataTable maxHeight={320}>
          <DataTableVirtualizedHeader />
          <DataTableVirtualizedBody<GridRow>
            estimateSize={37}
            fixedRowHeight
            getCellClassName={gridCellClassName}
          />
        </DataTable>
      </DataGrid>
    </DataTableRoot>
  )
}
