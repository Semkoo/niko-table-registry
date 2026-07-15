"use client"

/**
 * niko-table/grid — cell types with a live state panel for docs.
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ChevronRight } from "lucide-react"
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

function formatPos(
  pos: { rowId: string; columnId: string } | null | undefined,
): string {
  if (!pos) return "None"
  return `${pos.rowId} / ${pos.columnId}`
}

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

export function GridCellTypesState() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridCellTypesStateInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

function GridCellTypesStateInner({ onReset }: { onReset: () => void }) {
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
    <div className="w-full space-y-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Current Grid State</CardTitle>
          <CardDescription>
            Live view of the grid engine state for demonstration
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={onReset}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Focused Cell:</span>
              <span className="text-foreground">
                {formatPos(grid.focusedCell)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Editing Cell:</span>
              <span className="text-foreground">
                {formatPos(grid.editingCell)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Selection Anchor:</span>
              <span className="text-foreground">
                {formatPos(grid.selectionAnchor)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Total Rows:</span>
              <span className="text-foreground">{grid.rows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Can Undo / Redo:</span>
              <span className="text-foreground">
                {grid.canUndo ? "Yes" : "No"} / {grid.canRedo ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Last Commit:</span>
              <span className="text-foreground">
                {grid.lastCommit
                  ? `${grid.lastCommit.kind} (seq ${grid.lastCommit.seq})`
                  : "None"}
              </span>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground [&[data-state=open]>svg]:rotate-90">
              <ChevronRight className="size-3.5 transition-transform" />
              View Full State Object
            </CollapsibleTrigger>
            <CollapsibleContent>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-muted p-3 text-[10px] leading-relaxed">
                {JSON.stringify(
                  {
                    focusedCell: grid.focusedCell,
                    editingCell: grid.editingCell,
                    selectionAnchor: grid.selectionAnchor,
                    canUndo: grid.canUndo,
                    canRedo: grid.canRedo,
                    lastCommit: grid.lastCommit,
                    rowCount: grid.rows.length,
                    rows: grid.rows,
                  },
                  null,
                  2,
                )}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}
