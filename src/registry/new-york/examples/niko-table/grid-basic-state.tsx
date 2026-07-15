"use client"

/**
 * niko-table/grid — basic editable grid with a live state panel for docs.
 */
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import type { CellEditorProps } from "@/components/niko-table/grid/cells/cell-props"
import { GridTextCell } from "@/components/niko-table/grid/cells/grid-text-cell"
import { DataGridClipboard } from "@/components/niko-table/grid/components/grid-clipboard"
import { DataGridFillHandle } from "@/components/niko-table/grid/components/grid-fill-handle"
import { GridRowMenu } from "@/components/niko-table/grid/components/grid-row-menu"
import {
  DataGridAddRows,
  DataGridPasteHint,
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

const COLUMN_IDS = ["task", "assignee", "status"] as const
const LABELS: Record<string, string> = {
  task: "Task",
  assignee: "Assignee",
  status: "Status",
}

const resolveCell = (_columnId: string, raw: string): CellState<string> => ({
  raw,
  value: raw || null,
  status: raw === "" ? "empty" : "valid",
})

const cell = (raw: string): CellState<string> => resolveCell("", raw)

const INITIAL_ROWS: GridRow[] = [
  {
    id: "r1",
    task: cell("Draft proposal"),
    assignee: cell("Bailey"),
    status: cell("In progress"),
  },
  {
    id: "r2",
    task: cell("Review PR"),
    assignee: cell("Noah"),
    status: cell("Blocked"),
  },
  {
    id: "r3",
    task: cell("Ship release"),
    assignee: cell("Mia"),
    status: cell("Todo"),
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

export function GridBasicState() {
  const [resetKey, setResetKey] = React.useState(0)
  return (
    <GridBasicStateInner
      key={resetKey}
      onReset={() => setResetKey(k => k + 1)}
    />
  )
}

function GridBasicStateInner({ onReset }: { onReset: () => void }) {
  const grid = useDataGrid<GridRow>({
    columnIds: COLUMN_IDS,
    createEmptyRow,
    initialRows: INITIAL_ROWS,
  })

  const columns = React.useMemo<DataTableColumnDef<GridRow>[]>(
    () =>
      COLUMN_IDS.map(id => ({
        id,
        accessorFn: (row: GridRow) => {
          const v = row[id]
          return typeof v === "object" && v != null ? v.raw : ""
        },
        header: LABELS[id],
        size: 200,
        meta: { label: LABELS[id] },
        cell: ctx => (
          <DataGridCell row={ctx.row.original} columnId={id}>
            {(p: CellEditorProps) => (
              <GridTextCell
                {...p}
                resolve={raw => resolveCell(id, raw)}
                placeholder={LABELS[id]}
              />
            )}
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
          <DataGridFillHandle />
          <DataGridToolbar>
            <DataGridAddRows count={3} />
            <DataGridPasteHint />
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
