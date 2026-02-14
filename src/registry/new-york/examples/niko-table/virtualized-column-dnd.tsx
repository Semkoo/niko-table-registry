"use client"

import * as React from "react"
import { DataTableRoot, DataTable } from "@/components/niko-table/core"
import { DataTableVirtualizedEmptyBody } from "@/components/niko-table/core/data-table-virtualized-structure"
import {
  DataTableVirtualizedDndHeader,
  DataTableVirtualizedDndColumnBody,
} from "@/components/niko-table/core/data-table-virtualized-dnd-structure"
import { DataTableColumnDndProvider } from "@/components/niko-table/components/data-table-column-dnd"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
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
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    return {
      id: `EMP-${String(i + 1).padStart(4, "0")}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
      department: departments[Math.floor(Math.random() * departments.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      salary: Math.floor(Math.random() * 100000) + 50000,
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

export default function VirtualizedColumnDndExample() {
  const [columnOrder, setColumnOrder] = React.useState(() =>
    columns.map(c => c.id as string),
  )

  return (
    <DataTableRoot
      data={data}
      columns={columns}
      state={{ columnOrder }}
      onColumnOrderChange={setColumnOrder}
    >
      <DataTableColumnDndProvider
        columnOrder={columnOrder}
        onColumnOrderChange={setColumnOrder}
      >
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
                  There are no employees to display at this time.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
            </DataTableVirtualizedEmptyBody>
          </DataTableVirtualizedDndColumnBody>
        </DataTable>
      </DataTableColumnDndProvider>
    </DataTableRoot>
  )
}
