"use client"

import * as React from "react"
import { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
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
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
} from "@/components/niko-data-table"
import {
  DataTableColumnTitle,
  DataTableColumnHeader,
  DataTableColumnSortMenu,
  DataTableSelectionBar,
} from "@/components/niko-data-table/components"
import { useDataTable } from "@/components/niko-data-table/core"
import { exportTableToCSV } from "@/components/niko-data-table/filters"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, UserSearch, SearchX } from "lucide-react"
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

const data: Customer[] = [
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

// Selection bar component that uses the table from context
function SelectionBar({
  selectedCount,
  onClear,
}: {
  selectedCount: number
  onClear: () => void
}) {
  const { table } = useDataTable<Customer>()

  // Export handler
  const handleExport = React.useCallback(() => {
    exportTableToCSV(table, {
      filename: "selected-customers",
      excludeColumns: ["select"] as unknown as (keyof Customer)[],
      onlySelected: true,
    })
  }, [table])

  // Delete handler
  const handleDelete = React.useCallback(() => {
    console.log("Delete selected rows")
    // Handle delete action here
    onClear()
  }, [onClear])

  return (
    <DataTableSelectionBar selectedCount={selectedCount} onClear={onClear}>
      <Button size="sm" variant="outline" onClick={handleExport}>
        <Download className="mr-2 h-4 w-4" />
        Export Selected
      </Button>
      <Button size="sm" variant="destructive" onClick={handleDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </DataTableSelectionBar>
  )
}

export default function RowSelectionStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Derive selected rows from rowSelection state and data
  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key])
      .map(key => data.find(row => row.id === key))
      .filter(Boolean) as Customer[]
  }, [rowSelection])

  // Helper to clear selection
  const clearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 5 })
    setRowSelection({})
  }

  const selectAllRows = () => {
    const allSelected: RowSelectionState = {}
    data.forEach(customer => {
      allSelected[customer.id] = true
    })
    setRowSelection(allSelected)
  }

  const selectNone = () => {
    setRowSelection({})
  }

  // Calculate selection metrics
  const selectionMetrics = React.useMemo(() => {
    const selectedCompanies = Array.from(
      new Set(selectedRows.map(row => row.company)),
    )

    const selectedEmails = selectedRows.map(row => row.email)

    return {
      totalSelected: selectedRows.length,
      uniqueCompanies: selectedCompanies.length,
      companies: selectedCompanies,
      emails: selectedEmails,
    }
  }, [selectedRows])

  const columns: DataTableColumnDef<Customer>[] = React.useMemo(
    () => [
      {
        id: "select", // 'id: "select"' triggers auto-detection for row selection
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
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
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "email",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
            <DataTableColumnSortMenu variant="text" />
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
            <DataTableColumnSortMenu variant="text" />
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
            <DataTableColumnSortMenu variant="text" />
          </DataTableColumnHeader>
        ),
        meta: {
          label: "Phone",
        },
      },
    ],
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
          rowSelection,
        }}
        onGlobalFilterChange={setGlobalFilter}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
        onRowSelectionChange={setRowSelection}
      >
        <DataTableToolbarSection className="justify-between">
          <DataTableSearchFilter placeholder="Search anything..." />
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <SelectionBar
          selectedCount={selectedRows.length}
          onClear={clearSelection}
        />
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
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
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
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
          <CardTitle>Row Selection State</CardTitle>
          <CardDescription>
            Live view of the row selection table state with customer data
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
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {typeof globalFilter === "string"
                  ? globalFilter || "None"
                  : "Mixed Filters"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Customers:</span>
              <span className="text-foreground">{data.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Selected Customers:</span>
              <span className="text-foreground">
                {selectionMetrics.totalSelected}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Unique Companies:</span>
              <span className="text-foreground">
                {selectionMetrics.uniqueCompanies}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Selection Percentage:</span>
              <span className="text-foreground">
                {data.length > 0
                  ? Math.round(
                      (selectionMetrics.totalSelected / data.length) * 100,
                    )
                  : 0}
                %
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

          {/* Selection Actions */}
          <div className="flex gap-2 border-t pt-4">
            <Button variant="outline" size="sm" onClick={selectAllRows}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Select None
            </Button>
          </div>

          {/* Selected Companies List */}
          {selectionMetrics.companies.length > 0 && (
            <div className="border-t pt-4">
              <div className="mb-2 text-xs font-medium">
                Selected Companies:
              </div>
              <div className="flex flex-wrap gap-1">
                {selectionMetrics.companies.map(company => (
                  <Badge key={company} variant="outline" className="text-xs">
                    {company}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Detailed state (collapsible) */}
          <details className="border-t pt-4">
            <summary className="cursor-pointer text-xs font-medium hover:text-foreground">
              View Full State Object
            </summary>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <strong>Row Selection:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(rowSelection, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Selected Customers:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(
                    selectedRows.map(customer => ({
                      id: customer.id,
                      name: customer.name,
                      email: customer.email,
                      company: customer.company,
                    })),
                    null,
                    2,
                  )}
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
