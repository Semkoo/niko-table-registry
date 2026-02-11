"use client"

import * as React from "react"
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableEmptyBody,
} from "@/components/niko-table/core"
import { DataTableDndBody } from "@/components/niko-table/core/data-table-dnd-structure"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableColumnHeader,
  DataTableColumnTitle,
} from "@/components/niko-table/components"
import {
  DataTableRowDndProvider,
  DataTableRowDragHandle,
} from "@/components/niko-table/components/data-table-row-dnd"
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
type Task = {
  id: string
  title: string
  status: "todo" | "in-progress" | "done" | "cancelled"
  priority: "low" | "medium" | "high"
}

// Sample data
const initialData: Task[] = [
  {
    id: "TASK-001",
    title: "Set up project repository",
    status: "done",
    priority: "high",
  },
  {
    id: "TASK-002",
    title: "Design database schema",
    status: "in-progress",
    priority: "high",
  },
  {
    id: "TASK-003",
    title: "Implement authentication",
    status: "todo",
    priority: "medium",
  },
  {
    id: "TASK-004",
    title: "Create API endpoints",
    status: "todo",
    priority: "medium",
  },
  {
    id: "TASK-005",
    title: "Write unit tests",
    status: "todo",
    priority: "low",
  },
  {
    id: "TASK-006",
    title: "Set up CI/CD pipeline",
    status: "cancelled",
    priority: "low",
  },
  {
    id: "TASK-007",
    title: "Deploy to staging",
    status: "todo",
    priority: "medium",
  },
  {
    id: "TASK-008",
    title: "Performance optimization",
    status: "in-progress",
    priority: "high",
  },
]

// Status badge variant helper
const getStatusVariant = (status: Task["status"]) => {
  switch (status) {
    case "done":
      return "default"
    case "in-progress":
      return "secondary"
    case "todo":
      return "outline"
    case "cancelled":
      return "destructive"
    default:
      return "secondary"
  }
}

// Priority badge variant helper
const getPriorityVariant = (priority: Task["priority"]) => {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "secondary"
    case "low":
      return "outline"
    default:
      return "secondary"
  }
}

export default function RowDndStateExample() {
  const [data, setData] = React.useState(initialData)

  const columns: DataTableColumnDef<Task>[] = React.useMemo(
    () => [
      {
        id: "drag-handle",
        size: 40,
        header: () => null,
        cell: ({ row }) => <DataTableRowDragHandle rowId={row.id} />,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "order",
        size: 50,
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="#" />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.index + 1}</span>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Task ID" />
          </DataTableColumnHeader>
        ),
        meta: { label: "Task ID" },
        size: 110,
      },
      {
        accessorKey: "title",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Title" />
          </DataTableColumnHeader>
        ),
        meta: { label: "Title" },
      },
      {
        accessorKey: "status",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Status" />
          </DataTableColumnHeader>
        ),
        meta: { label: "Status" },
        size: 130,
        cell: ({ row }) => {
          const status = row.getValue("status") as Task["status"]
          return <Badge variant={getStatusVariant(status)}>{status}</Badge>
        },
      },
      {
        accessorKey: "priority",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Priority" />
          </DataTableColumnHeader>
        ),
        meta: { label: "Priority" },
        size: 110,
        cell: ({ row }) => {
          const priority = row.getValue("priority") as Task["priority"]
          return (
            <Badge variant={getPriorityVariant(priority)}>{priority}</Badge>
          )
        },
      },
    ],
    [],
  )

  const resetData = () => setData(initialData)

  return (
    <div className="w-full space-y-4">
      <DataTableRoot data={data} columns={columns} getRowId={row => row.id}>
        <DataTableRowDndProvider data={data} onReorder={setData}>
          <DataTable>
            <DataTableHeader />
            <DataTableDndBody>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <Inbox className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No tasks found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    There are no tasks to display at this time.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
              </DataTableEmptyBody>
            </DataTableDndBody>
          </DataTable>
        </DataTableRowDndProvider>
      </DataTableRoot>

      {/* State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Row Order</CardTitle>
          <CardDescription>
            Drag rows to reorder. The order is tracked in state.
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetData}>
              Reset Order
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">{data.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Current Order:</span>
              <span className="text-foreground">
                {data.map(d => d.id).join(" → ")}
              </span>
            </div>
          </div>

          <details className="mt-4 border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
              {JSON.stringify(
                data.map(d => ({ id: d.id, title: d.title })),
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
