"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import { DataTableVirtualizedEmptyBody } from "@/components/niko-table/core/data-table-virtualized-structure"
import {
  DataTableVirtualizedDndHeader,
  DataTableVirtualizedDndColumnBody,
} from "@/components/niko-table/core/data-table-virtualized-dnd-structure"
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
import { Inbox } from "lucide-react"

// Types
type Employee = {
  id: string
  name: string
  email: string
  department: string
  role: string
  location: string
  status: "active" | "on-leave" | "remote"
  salary: number
}

// Generate large dataset for virtualization demo
const generateEmployees = (count: number): Employee[] => {
  const firstNames = [
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
    "Karen",
    "Leo",
    "Mia",
    "Noah",
    "Olivia",
    "Paul",
    "Quinn",
    "Ruby",
    "Sam",
    "Tina",
  ]
  const lastNames = [
    "Johnson",
    "Smith",
    "Williams",
    "Brown",
    "Martinez",
    "Lee",
    "Kim",
    "Davis",
    "Wilson",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
  ]
  const departments = [
    "Engineering",
    "Design",
    "Marketing",
    "Sales",
    "Product",
    "HR",
    "Finance",
    "Operations",
  ]
  const roles = [
    "Senior Developer",
    "UI Designer",
    "Marketing Lead",
    "Backend Developer",
    "Product Manager",
    "DevOps Engineer",
    "UX Researcher",
    "Account Executive",
    "Data Analyst",
    "QA Engineer",
  ]
  const locations = [
    "New York",
    "San Francisco",
    "Chicago",
    "Austin",
    "Seattle",
    "Denver",
    "Portland",
    "Boston",
    "Miami",
    "Atlanta",
  ]
  const statuses: Employee["status"][] = ["active", "on-leave", "remote"]

  return Array.from({ length: count }, (_, i) => {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[(i * 3) % lastNames.length]
    return {
      id: `EMP-${String(i + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
      department: departments[i % departments.length],
      role: roles[(i * 5) % roles.length],
      location: locations[(i * 7) % locations.length],
      status: statuses[i % statuses.length],
      salary: 50000 + ((i * 1337) % 100000),
    }
  })
}

const data = generateEmployees(500)

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

// Column definitions — all columns need explicit `id` for column ordering
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
    size: 170,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "email",
    id: "email",
    header: "Email",
    size: 250,
    cell: ({ row }) => (
      <div className="text-muted-foreground">{row.getValue("email")}</div>
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
  {
    accessorKey: "salary",
    id: "salary",
    header: "Salary",
    size: 120,
    cell: ({ row }) => {
      const salary = row.getValue("salary") as number
      return <div className="font-mono">${salary.toLocaleString()}</div>
    },
  },
]

const initialColumnOrder = columns.map(c => c.id as string)

export default function VirtualizedColumnDndExample() {
  const [columnOrder, setColumnOrder] =
    React.useState<string[]>(initialColumnOrder)

  return (
    <DataTableRoot
      data={data}
      columns={columns}
      state={{ columnOrder }}
      onColumnOrderChange={setColumnOrder}
    >
      <DataTableColumnResize />
      <DataTableColumnDndProvider
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
      >
        {/*
         * Two reorder surfaces, one state — header drag and view-menu drag
         * both update the same `columnOrder`. Search filters the 500-row
         * virtualized dataset on the fly.
         */}
        <DataTableToolbarSection className="justify-between">
          <DataTableSearchFilter placeholder="Search employees..." />
          <DataTableViewDndMenu
            columnOrder={columnOrder}
            onColumnOrderChange={setColumnOrder}
            onReset={() => setColumnOrder(initialColumnOrder)}
          />
        </DataTableToolbarSection>
        <DataTable height={500}>
          <DataTableVirtualizedDndHeader />
          <DataTableVirtualizedDndColumnBody estimateSize={40} overscan={10}>
            <DataTableVirtualizedEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <Inbox className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No employees found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try a different search.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
            </DataTableVirtualizedEmptyBody>
          </DataTableVirtualizedDndColumnBody>
        </DataTable>
      </DataTableColumnDndProvider>
    </DataTableRoot>
  )
}
