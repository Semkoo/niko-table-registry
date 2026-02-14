"use client"

import * as React from "react"
import { DataTableRoot, DataTable } from "@/components/niko-table/core"
import {
  DataTableVirtualizedHeader,
  DataTableVirtualizedEmptyBody,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { DataTableVirtualizedDndBody } from "@/components/niko-table/core/data-table-virtualized-dnd-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import {
  DataTableRowDndProvider,
  DataTableRowDragHandle,
} from "@/components/niko-table/components/data-table-row-dnd"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Inbox } from "lucide-react"

// Types
type Task = {
  id: string
  title: string
  status: "todo" | "in-progress" | "done" | "cancelled"
  priority: "low" | "medium" | "high"
  assignee: string
}

// Generate large dataset for virtualization demo
const generateTasks = (count: number): Task[] => {
  const titles = [
    "Set up project repository",
    "Design database schema",
    "Implement authentication",
    "Create API endpoints",
    "Write unit tests",
    "Set up CI/CD pipeline",
    "Deploy to staging",
    "Performance optimization",
    "Code review",
    "Update documentation",
    "Fix login bug",
    "Add search feature",
    "Refactor user module",
    "Create dashboard",
    "Implement caching",
    "Add error handling",
    "Set up monitoring",
    "Write integration tests",
    "Optimize queries",
    "Add pagination",
  ]
  const statuses: Task["status"][] = [
    "todo",
    "in-progress",
    "done",
    "cancelled",
  ]
  const priorities: Task["priority"][] = ["low", "medium", "high"]
  const assignees = [
    "Alice",
    "Bob",
    "Carol",
    "David",
    "Eva",
    "Frank",
    "Grace",
    "Henry",
    "Ivy",
    "Jack",
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `TASK-${String(i + 1).padStart(4, "0")}`,
    title: titles[i % titles.length],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
  }))
}

const initialData = generateTasks(500)

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

export default function VirtualizedRowDndExample() {
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
        accessorKey: "assignee",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Assignee" />
          </DataTableColumnHeader>
        ),
        meta: { label: "Assignee" },
        size: 120,
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

  return (
    <DataTableRoot data={data} columns={columns} getRowId={row => row.id}>
      <DataTableRowDndProvider data={data} onReorder={setData}>
        <DataTable height={500}>
          <DataTableVirtualizedHeader />
          <DataTableVirtualizedDndBody estimateSize={40} overscan={10}>
            <DataTableVirtualizedEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <Inbox className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No tasks found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  There are no tasks to display at this time.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
            </DataTableVirtualizedEmptyBody>
          </DataTableVirtualizedDndBody>
        </DataTable>
      </DataTableRowDndProvider>
    </DataTableRoot>
  )
}
