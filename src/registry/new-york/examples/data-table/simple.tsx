"use client"

import {
  DataTableBody,
  DataTable,
  DataTableHeader,
  DataTableRoot,
  DataTableSkeleton,
  DataTableEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-data-table"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Inbox } from "lucide-react"

type User = {
  id: string
  name: string
  email: string
  status: "active" | "inactive"
}

const columns: DataTableColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={
          row.original.status === "active" ? "text-green-600" : "text-gray-400"
        }
      >
        {row.original.status}
      </span>
    ),
  },
]

const data: User[] = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "active" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "active" },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    status: "inactive",
  },
]

export default function SimpleTableExample() {
  // You can pass isLoading prop to show skeleton
  // const [isLoading, setIsLoading] = React.useState(false)

  return (
    <DataTableRoot data={data} columns={columns}>
      <DataTable>
        <DataTableHeader />
        <DataTableBody>
          <DataTableSkeleton />
          <DataTableEmptyBody>
            <DataTableEmptyMessage>
              <DataTableEmptyIcon>
                <Inbox className="size-12" />
              </DataTableEmptyIcon>
              <DataTableEmptyTitle>No users found</DataTableEmptyTitle>
              <DataTableEmptyDescription>
                There are no users to display at this time.
              </DataTableEmptyDescription>
            </DataTableEmptyMessage>
          </DataTableEmptyBody>
        </DataTableBody>
      </DataTable>
    </DataTableRoot>
  )
}
