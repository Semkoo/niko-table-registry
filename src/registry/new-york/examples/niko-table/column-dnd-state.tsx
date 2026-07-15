"use client"

import * as React from "react"
import type { VisibilityState } from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableEmptyBody } from "@/components/niko-table/core/data-table-structure"
import {
  DataTableDndHeader,
  DataTableDndColumnBody,
} from "@/components/niko-table/core/data-table-column-dnd-structure"
import { DataTableColumnDndProvider } from "@/components/niko-table/components/data-table-column-dnd"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewDndMenu } from "@/components/niko-table/components/data-table-view-dnd-menu"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Inbox } from "lucide-react"

// Types
type Employee = {
  id: string
  name: string
  department: string
  role: string
  location: string
  status: "active" | "on-leave" | "remote"
}

// Sample data
const data: Employee[] = [
  {
    id: "EMP-001",
    name: "Alice Johnson",
    department: "Engineering",
    role: "Senior Developer",
    location: "New York",
    status: "active",
  },
  {
    id: "EMP-002",
    name: "Bob Smith",
    department: "Design",
    role: "UI Designer",
    location: "San Francisco",
    status: "remote",
  },
  {
    id: "EMP-003",
    name: "Carol Williams",
    department: "Marketing",
    role: "Marketing Lead",
    location: "Chicago",
    status: "active",
  },
  {
    id: "EMP-004",
    name: "David Brown",
    department: "Engineering",
    role: "Backend Developer",
    location: "Austin",
    status: "on-leave",
  },
  {
    id: "EMP-005",
    name: "Eva Martinez",
    department: "Product",
    role: "Product Manager",
    location: "Seattle",
    status: "active",
  },
  {
    id: "EMP-006",
    name: "Frank Lee",
    department: "Engineering",
    role: "DevOps Engineer",
    location: "Denver",
    status: "remote",
  },
  {
    id: "EMP-007",
    name: "Grace Kim",
    department: "Design",
    role: "UX Researcher",
    location: "Portland",
    status: "active",
  },
  {
    id: "EMP-008",
    name: "Henry Davis",
    department: "Sales",
    role: "Account Executive",
    location: "Boston",
    status: "active",
  },
]

// Status badge variant helper
const getStatusVariant = (status: Employee["status"]) => {
  switch (status) {
    case "active":
      return "default"
    case "remote":
      return "secondary"
    case "on-leave":
      return "outline"
    default:
      return "secondary"
  }
}

// Column definitions
const columns: DataTableColumnDef<Employee>[] = [
  {
    accessorKey: "id",
    id: "id",
    header: "Employee ID",
    size: 120,
  },
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
    size: 160,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "department",
    id: "department",
    header: "Department",
    size: 140,
  },
  {
    accessorKey: "role",
    id: "role",
    header: "Role",
    size: 170,
  },
  {
    accessorKey: "location",
    id: "location",
    header: "Location",
    size: 140,
  },
  {
    accessorKey: "status",
    id: "status",
    header: "Status",
    size: 110,
    cell: ({ row }) => {
      const status = row.getValue("status") as Employee["status"]
      return <Badge variant={getStatusVariant(status)}>{status}</Badge>
    },
  },
]

const initialColumnOrder = columns.map(c => c.id as string)

export default function ColumnDndStateExample() {
  const [columnOrder, setColumnOrder] =
    React.useState<string[]>(initialColumnOrder)
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState<string | object>("")

  const resetAll = () => {
    setColumnOrder(initialColumnOrder)
    setColumnVisibility({})
    setGlobalFilter("")
  }

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{ columnOrder, columnVisibility, globalFilter }}
        onColumnOrderChange={setColumnOrder}
        onColumnVisibilityChange={setColumnVisibility}
        onGlobalFilterChange={setGlobalFilter}
      >
        <DataTableColumnResize />
        <DataTableColumnDndProvider
          columnOrder={columnOrder}
          onColumnOrderChange={setColumnOrder}
        >
          {/*
           * Two reorder surfaces share one `columnOrder`:
           *   1. Drag column headers (DataTableColumnDndProvider)
           *   2. Drag rows in the View menu (DataTableViewDndMenu)
           * Either updates the same state, so both stay in sync.
           * The View menu also toggles visibility and exposes a Reset.
           */}
          <DataTableToolbarSection className="justify-between">
            <DataTableSearchFilter placeholder="Search employees..." />
            <DataTableViewDndMenu
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              onReset={resetAll}
            />
          </DataTableToolbarSection>
          <DataTable>
            <DataTableDndHeader />
            <DataTableDndColumnBody>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <Inbox className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No employees found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
              </DataTableEmptyBody>
            </DataTableDndColumnBody>
          </DataTable>
        </DataTableColumnDndProvider>
      </DataTableRoot>

      {/* State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Column DnD State</CardTitle>
          <CardDescription>
            Header drag, view-menu drag, visibility toggles, and search — all
            live state.
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAll}>
              Reset
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Total Columns:</span>
              <span className="text-foreground">{columnOrder.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Current Order:</span>
              <span className="text-foreground">{columnOrder.join(" → ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Hidden:</span>
              <span className="text-foreground">
                {Object.entries(columnVisibility)
                  .filter(([, v]) => !v)
                  .map(([k]) => k)
                  .join(", ") || "none"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Search:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string" && globalFilter
                  ? globalFilter
                  : "—"}
              </span>
            </div>
          </div>

          <details className="mt-4 border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(
                { columnOrder, columnVisibility, globalFilter },
                null,
                2,
              )}
            </pre>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
