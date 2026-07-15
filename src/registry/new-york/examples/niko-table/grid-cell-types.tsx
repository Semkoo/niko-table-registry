"use client"

/**
 * niko-table/grid — the built-in cell editors.
 *
 * Six cell types, each following the display/editor split (the heavy editor
 * mounts only for the cell being edited): text, number, currency (a number cell
 * with a display `format`), checkbox, date (popover calendar), and select
 * (searchable dropdown). A consumer dispatches the editor per column — the grid
 * itself stays type-agnostic; validity comes from the injected `resolve`.
 */
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridCheckboxCell } from "@/components/niko-table/grid/cells/grid-checkbox-cell"
import { GridDateCell } from "@/components/niko-table/grid/cells/grid-date-cell"
import { GridSelectCell } from "@/components/niko-table/grid/cells/grid-select-cell"
import {
  GridNumberCell,
  GridTextCell,
} from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import { DataGrid } from "@/components/niko-table/grid/core/data-grid"
import { DataGridCell } from "@/components/niko-table/grid/core/data-grid-context"
import { useDataGrid } from "@/components/niko-table/grid/hooks/use-data-grid"
import type {
  CellState,
  GridRow,
} from "@/components/niko-table/grid/types/grid-cell"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import * as React from "react"

type CellType = "text" | "number" | "currency" | "checkbox" | "date" | "select"

interface ColumnSpec {
  id: string
  label: string
  type: CellType
  width: number
  options?: readonly string[]
}

const PRIORITIES = ["Low", "Medium", "High"] as const

const SPECS: ColumnSpec[] = [
  { id: "name", label: "Name", type: "text", width: 180 },
  { id: "hours", label: "Hours", type: "number", width: 110 },
  { id: "rate", label: "Rate", type: "currency", width: 120 },
  { id: "billable", label: "Billable", type: "checkbox", width: 100 },
  { id: "due", label: "Due", type: "date", width: 150 },
  {
    id: "priority",
    label: "Priority",
    type: "select",
    width: 140,
    options: PRIORITIES,
  },
]

const TRUTHY = ["true", "1", "yes"]

function resolveFor(
  spec: ColumnSpec | undefined,
  raw: string,
): CellState<string> {
  const trimmed = raw.trim()
  switch (spec?.type) {
    case "number":
    case "currency": {
      if (trimmed === "") return { raw, value: null, status: "empty" }
      const ok = Number.isFinite(Number(trimmed))
      return {
        raw,
        value: ok ? trimmed : null,
        status: ok ? "valid" : "invalid",
      }
    }
    case "date": {
      if (trimmed === "") return { raw, value: null, status: "empty" }
      const ok = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
      return {
        raw,
        value: ok ? trimmed : null,
        status: ok ? "valid" : "invalid",
      }
    }
    case "checkbox": {
      const isTrue = TRUTHY.includes(trimmed.toLowerCase())
      return { raw: String(isTrue), value: String(isTrue), status: "valid" }
    }
    case "select": {
      const match = spec.options?.includes(raw) ?? false
      return {
        raw,
        value: match ? raw : null,
        status: raw === "" ? "empty" : match ? "valid" : "invalid",
      }
    }
    default:
      return { raw, value: raw || null, status: raw === "" ? "empty" : "valid" }
  }
}

const SPEC_BY_ID = Object.fromEntries(SPECS.map(s => [s.id, s]))
const resolveCell = (columnId: string, raw: string) =>
  resolveFor(SPEC_BY_ID[columnId], raw)

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const c = (id: string, raw: string) => resolveCell(id, raw)
const INITIAL_ROWS: GridRow[] = [
  {
    id: "r1",
    name: c("name", "Design review"),
    hours: c("hours", "3"),
    rate: c("rate", "120"),
    billable: c("billable", "true"),
    due: c("due", "2026-02-14"),
    priority: c("priority", "High"),
  },
  {
    id: "r2",
    name: c("name", "Standup"),
    hours: c("hours", "1"),
    rate: c("rate", "0"),
    billable: c("billable", "false"),
    due: c("due", "2026-02-10"),
    priority: c("priority", "Low"),
  },
]

const createEmptyRow = (id: string): GridRow => ({ id })
const gridCellClassName = () =>
  "border-border border-r p-0 align-middle last:border-r-0"

function CellByType({ spec, ...p }: CellEditorProps & { spec: ColumnSpec }) {
  switch (spec.type) {
    case "number":
      return (
        <GridNumberCell
          {...p}
          resolve={raw => resolveCell(spec.id, raw)}
          placeholder={spec.label}
        />
      )
    case "currency":
      return (
        <GridNumberCell
          {...p}
          resolve={raw => resolveCell(spec.id, raw)}
          placeholder={spec.label}
          format={raw => {
            const n = Number(raw)
            return Number.isFinite(n) ? usd.format(n) : raw
          }}
        />
      )
    case "checkbox":
      return <GridCheckboxCell {...p} aria-label={spec.label} />
    case "date":
      return <GridDateCell {...p} placeholder={spec.label} />
    case "select":
      return (
        <GridSelectCell
          {...p}
          options={(spec.options ?? []).map(o => ({ label: o, value: o }))}
          placeholder="Select…"
          displayLabel={p.cell.value ?? undefined}
        />
      )
    default:
      return (
        <GridTextCell
          {...p}
          resolve={raw => resolveCell(spec.id, raw)}
          placeholder={spec.label}
        />
      )
  }
}

export function GridCellTypes() {
  const grid = useDataGrid<GridRow>({
    columnIds: SPECS.map(s => s.id),
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      SPECS.map(spec => ({
        id: spec.id,
        accessorFn: (row: GridRow) => {
          const v = row[spec.id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: spec.label,
        size: spec.width,
        meta: { label: spec.label },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={spec.id}>
            {(p: CellEditorProps) => <CellByType spec={spec} {...p} />}
          </DataGridCell>
        ),
      })),
    [],
  )

  return (
    <DataTableRoot data={grid.rows} columns={columns} getRowId={r => r.id}>
      <DataGrid grid={grid}>
        <DataGridClipboard resolveCell={resolveCell} />
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
      </DataGrid>
    </DataTableRoot>
  )
}
