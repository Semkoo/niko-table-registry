"use client"

import * as React from "react"
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core"
import {
  DataTableToolbarSection,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableColumnTitle,
  DataTableColumnHeader,
} from "@/components/niko-table/components"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { SYSTEM_COLUMN_IDS, FILTER_VARIANTS } from "@/components/niko-table/lib"
import { useDataTable } from "@/components/niko-table/core"
import { exportTableToCSV } from "@/components/niko-table/filters/table-export-button"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Download, Trash2, UserSearch, SearchX } from "lucide-react"

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
      excludeColumns: [
        SYSTEM_COLUMN_IDS.SELECT,
      ] as unknown as (keyof Customer)[],
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

export default function RowSelectionExample() {
  const [rowSelection, setRowSelection] = React.useState({})

  // Derive selected rows from rowSelection state and data
  const selectedRows = React.useMemo(() => {
    return Object.keys(rowSelection)
      .filter(key => rowSelection[key as keyof typeof rowSelection])
      .map(key => data.find(row => row.id === key))
      .filter(Boolean) as Customer[]
  }, [rowSelection])

  // Helper to clear selection
  const clearSelection = React.useCallback(() => {
    setRowSelection({})
  }, [])

  const columns: DataTableColumnDef<Customer>[] = React.useMemo(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.SELECT, // 'id: "select"' triggers auto-detection for row selection
        size: 40, // Compact width for checkbox column
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
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
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
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
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
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
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
    <DataTableRoot
      data={data}
      columns={columns}
      state={{
        rowSelection,
      }}
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
                Try adjusting your search to find what you&apos;re looking for.
              </DataTableEmptyDescription>
            </DataTableEmptyFilteredMessage>
          </DataTableEmptyBody>
        </DataTableBody>
      </DataTable>
      <DataTablePagination pageSizeOptions={[5, 10, 20]} />
    </DataTableRoot>
  )
}
