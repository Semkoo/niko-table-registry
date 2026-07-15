"use client"

import { useState } from "react"
import type { ColumnSizingState } from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"

type Team = {
  id: string
  name: string
  city: string
  wins: number
  status: "active" | "inactive"
}

const data: Team[] = [
  {
    id: "1",
    name: "Fountain Valley Hornets",
    city: "Halifax",
    wins: 21,
    status: "active",
  },
  {
    id: "2",
    name: "Darefield Lightning",
    city: "Halifax",
    wins: 9,
    status: "active",
  },
  {
    id: "3",
    name: "South Jordan Cougars",
    city: "Halifax",
    wins: 11,
    status: "active",
  },
  {
    id: "4",
    name: "Treutelside Phoenix",
    city: "Halifax",
    wins: 18,
    status: "active",
  },
  {
    id: "5",
    name: "West Lila Grizzlies",
    city: "Halifax",
    wins: 7,
    status: "inactive",
  },
]

// Small base `size` values whose sum is far narrower than the container, so
// auto-fit scales the resizable columns up to fill the width.
const columns: DataTableColumnDef<Team>[] = [
  {
    accessorKey: "name",
    size: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Team" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Team" },
  },
  {
    accessorKey: "city",
    size: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="City" />
      </DataTableColumnHeader>
    ),
    meta: { label: "City" },
  },
  {
    accessorKey: "wins",
    size: 80,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Wins" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Wins" },
  },
  {
    accessorKey: "status",
    size: 100,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Status" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Status" },
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("status")}</Badge>
    ),
  },
]

const BASE_TOTAL = columns.reduce((sum, c) => sum + (c.size ?? 0), 0)

export default function ColumnResizeAutofitTable() {
  // Controlled sizing so the readout reflects the widths auto-fit computes on
  // load. Starts empty; `useColumnAutoFit` fills it via `onColumnSizingChange`.
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const fitTotal = Object.values(columnSizing).reduce((sum, w) => sum + w, 0)

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{ columnSizing }}
        onColumnSizingChange={setColumnSizing}
      >
        <DataTableColumnResize />
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>

      <div className="grid gap-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span className="font-medium">Declared width total:</span>
          <span className="text-foreground">{BASE_TOTAL}px</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Auto-fit width total:</span>
          <span className="text-foreground">
            {fitTotal > 0 ? `${Math.round(fitTotal)}px` : "measuring"}
          </span>
        </div>
      </div>
    </div>
  )
}
