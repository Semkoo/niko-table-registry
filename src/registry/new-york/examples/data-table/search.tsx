"use client"

import React from "react"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableEmptyBody,
  DataTableSkeleton,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table"
import { TableColumnHeader } from "@/components/niko-table/components"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Button } from "@/components/ui/button"
import { UserSearch, SearchX } from "lucide-react"

type Customer = {
  id: string
  name: string
  email: string
  company: string
  phone: string
}

const columns: DataTableColumnDef<Customer>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Name",
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Email",
    },
  },
  {
    accessorKey: "company",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Company",
    },
  },
  {
    accessorKey: "phone",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Phone",
    },
  },
]

const mockData: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    company: "Acme Corp",
    phone: "555-0100",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@techco.com",
    company: "TechCo",
    phone: "555-0101",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@startup.io",
    company: "StartUp Inc",
    phone: "555-0102",
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice@designco.com",
    company: "DesignCo",
    phone: "555-0103",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@consulting.com",
    company: "Consulting LLC",
    phone: "555-0104",
  },
  {
    id: "6",
    name: "Diana Prince",
    email: "diana@enterprise.com",
    company: "Enterprise Inc",
    phone: "555-0105",
  },
  {
    id: "7",
    name: "Ethan Hunt",
    email: "ethan@mission.io",
    company: "Mission Impossible",
    phone: "555-0106",
  },
  {
    id: "8",
    name: "Fiona Green",
    email: "fiona@greentech.com",
    company: "GreenTech",
    phone: "555-0107",
  },
  {
    id: "9",
    name: "George Miller",
    email: "george@media.com",
    company: "Media Corp",
    phone: "555-0108",
  },
  {
    id: "10",
    name: "Hannah Lee",
    email: "hannah@innovation.io",
    company: "Innovation Labs",
    phone: "555-0109",
  },
]

// Simulate API call
function fetchData(delay = 1500): Promise<Customer[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockData)
    }, delay)
  })
}

export default function SearchTableExample() {
  const [data, setData] = React.useState<Customer[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Simulate initial data fetch
  React.useEffect(() => {
    setIsLoading(true)
    fetchData()
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  // Simulate refetch for demo purposes
  const handleRefresh = () => {
    setIsLoading(true)
    fetchData(1000)
      .then(setData)
      .finally(() => setIsLoading(false))
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {isLoading ? "Loading data..." : `Showing ${data.length} customers`}
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} size="sm">
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      <DataTableRoot data={data} columns={columns} isLoading={isLoading}>
        <DataTableToolbarSection className="justify-between">
          <DataTableSearchFilter placeholder="Search anything..." />
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            <DataTableSkeleton rows={5} />
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <UserSearch className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No customers found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  There are no customers to display at this time.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
              <DataTableEmptyFilteredMessage>
                <DataTableEmptyIcon>
                  <SearchX className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try adjusting your search to find what you&apos;re looking
                  for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
        <DataTablePagination pageSizeOptions={[5, 10, 20]} />
      </DataTableRoot>
    </div>
  )
}
