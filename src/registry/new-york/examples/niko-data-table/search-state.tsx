"use client"

import React, { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table"
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
} from "@/components/niko-data-table"
import {
  DataTableColumnTitle,
  DataTableColumnHeader,
  DataTableColumnSortMenu,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Button } from "@/components/ui/button"
import { UserSearch, SearchX } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Name",
    },
  },
  {
    accessorKey: "email",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Email",
    },
  },
  {
    accessorKey: "company",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Company",
    },
  },
  {
    accessorKey: "phone",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
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

export default function SearchTableStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  // Loading and data state
  const [data, setData] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 5 })
  }

  // Calculate filtered data for display metrics
  const filteredRowCount = React.useMemo(() => {
    if (!globalFilter || !data.length) return data.length

    const filtered = data.filter(item => {
      if (typeof globalFilter !== "string") return true
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase()),
      )
    })
    return filtered.length
  }, [data, globalFilter])

  // Calculate loading and data metrics
  const dataMetrics = React.useMemo(() => {
    const uniqueCompanies = Array.from(
      new Set(data.map(customer => customer.company)),
    )
    const emailDomains = Array.from(
      new Set(data.map(customer => customer.email.split("@")[1])),
    )

    return {
      totalCustomers: data.length,
      uniqueCompanies: uniqueCompanies.length,
      emailDomains: emailDomains.length,
      companies: uniqueCompanies,
    }
  }, [data])

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

      <DataTableRoot
        data={data}
        columns={columns}
        isLoading={isLoading}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
        }}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnFiltersChange={filters => {
          setColumnFilters(filters)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
      >
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

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Search Table State</CardTitle>
          <CardDescription>
            Live view of the search table state with loading and data management
          </CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={resetAllState}>
              Reset All State
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span className="font-medium">Loading State:</span>
              <span className="text-foreground">
                {isLoading ? "Loading..." : "Loaded"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? globalFilter || "None"
                  : "Mixed Filters"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Customers:</span>
              <span className="text-foreground">
                {dataMetrics.totalCustomers}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Filtered Results:</span>
              <span className="text-foreground">{filteredRowCount}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Unique Companies:</span>
              <span className="text-foreground">
                {dataMetrics.uniqueCompanies}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Email Domains:</span>
              <span className="text-foreground">
                {dataMetrics.emailDomains}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Sorting:</span>
              <span className="text-foreground">
                {sorting.length > 0
                  ? sorting
                      .map(s => `${s.id} ${s.desc ? "desc" : "asc"}`)
                      .join(", ")
                  : "None"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Page:</span>
              <span className="text-foreground">
                {pagination.pageIndex + 1} (Size: {pagination.pageSize})
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Hidden Columns:</span>
              <span className="text-foreground">
                {
                  Object.values(columnVisibility).filter(v => v === false)
                    .length
                }
              </span>
            </div>
          </div>

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Loading State:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    { isLoading, dataLength: data.length },
                    null,
                    2,
                  )}
                </pre>
              </div>
              <div>
                <strong>Global Filter:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(globalFilter, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Pagination:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(pagination, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Visibility:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnVisibility, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  )
}
