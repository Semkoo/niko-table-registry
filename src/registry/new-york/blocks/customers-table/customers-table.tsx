"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
} from "@/components/niko-table/core/data-table-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableExportButton } from "@/components/niko-table/components/data-table-export-button"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from "@/components/niko-table/components/data-table-empty-state"
import {
  DataTableRowMenuScope,
  RowMenuItem,
  RowMenuSeparator,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowDownRight,
  ArrowUpRight,
  Globe2,
  Mail,
  MoreHorizontal,
  SearchX,
  UserPlus,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  customers as sampleCustomers,
  planOptions,
  statusOptions,
  type Customer,
} from "./customers-data"
import { formatDate, initials, money, statusDot } from "./customers-format"
import { CustomerSheet } from "./customer-sheet"
import { AddCustomerSheet, type NewCustomer } from "./add-customer-sheet"

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `CustomersTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function ViewCustomerItem({ onView }: { onView: (c: Customer) => void }) {
  const customer = useDataTableRow<Customer>()
  return (
    <RowMenuItem onClick={() => onView(customer)}>View customer</RowMenuItem>
  )
}

function CopyEmailItem({ onCopied }: { onCopied: (c: Customer) => void }) {
  const customer = useDataTableRow<Customer>()
  return (
    <RowMenuItem
      onClick={() => {
        void navigator.clipboard?.writeText(customer.email)
        onCopied(customer)
      }}
    >
      Copy email
    </RowMenuItem>
  )
}

function CancelSubscriptionItem({
  onCancel,
}: {
  onCancel: (c: Customer) => void
}) {
  const customer = useDataTableRow<Customer>()
  return (
    <RowMenuItem
      variant="destructive"
      disabled={customer.status === "churned"}
      onClick={() => onCancel(customer)}
    >
      Cancel subscription
    </RowMenuItem>
  )
}

function sortableHeader() {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
      <DataTableColumnSortMenu />
    </DataTableColumnHeader>
  )
}

function useCustomerColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Customer>[]>(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.SELECT,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            // Plain boolean: Radix and Base UI checkboxes take indeterminate differently.
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all customers on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.name}`}
          />
        ),
      },
      {
        accessorKey: "name",
        meta: { label: "Customer" },
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{row.original.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "email",
        meta: { label: "Email" },
        // Searchable and exported, but shown under the name instead.
        enableHiding: false,
      },
      {
        accessorKey: "plan",
        meta: { label: "Plan", options: planOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <Badge variant="secondary" className="capitalize">
            {row.original.plan}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status", options: statusOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 capitalize">
            <span
              className={cn(
                "size-2 rounded-full",
                statusDot[row.original.status],
              )}
              aria-hidden="true"
            />
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "mrr",
        meta: { label: "MRR" },
        header: sortableHeader,
        cell: ({ row }) => {
          const { mrr, mrrChange, status } = row.original
          if (status !== "active") {
            return <span className="text-muted-foreground">—</span>
          }
          const up = mrrChange >= 0
          return (
            <div className="flex items-center gap-2 tabular-nums">
              <span className="font-medium">{money.format(mrr)}</span>
              <span
                className={cn(
                  "flex items-center text-xs",
                  up ? "text-success" : "text-destructive",
                )}
              >
                {up ? (
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="size-3.5" aria-hidden="true" />
                )}
                <span className="sr-only">{up ? "Up" : "Down"}</span>
                {Math.abs(mrrChange)}%
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "seatsUsed",
        meta: { label: "Seats" },
        header: sortableHeader,
        cell: ({ row }) => {
          const { seatsUsed, seatsTotal } = row.original
          return (
            <div className="flex w-28 flex-col gap-1">
              <span className="text-xs text-muted-foreground tabular-nums">
                {seatsUsed} of {seatsTotal}
              </span>
              <Progress
                value={(seatsUsed / seatsTotal) * 100}
                className="h-1.5"
                aria-label={`${seatsUsed} of ${seatsTotal} seats used`}
              />
            </div>
          )
        },
      },
      {
        accessorKey: "signedUp",
        meta: { label: "Signed up" },
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDate(row.original.signedUp)}
          </span>
        ),
      },
      {
        accessorKey: "region",
        meta: { label: "Region" },
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <Globe2
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            {row.original.region}
          </span>
        ),
      },
      {
        id: "actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for ${row.original.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DataTableRowMenuScope row={row.original} surface="dropdown">
                  {rowMenu}
                </DataTableRowMenuScope>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [rowMenu],
  )
}

function CustomersHeader({ onAddCustomer }: { onAddCustomer: () => void }) {
  const { table } = useDataTable<Customer>()
  const rows = table.getFilteredRowModel().rows
  const mrr = rows.reduce((sum, row) => sum + row.original.mrr, 0)

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Customers</h2>
        <p className="text-sm text-muted-foreground">
          {rows.length} customers · {money.format(mrr)} MRR
        </p>
      </div>
      <div className="flex items-center gap-2">
        <DataTableExportButton filename="customers" useHeaderLabels />
        <Button size="sm" onClick={onAddCustomer}>
          <UserPlus className="size-4" aria-hidden="true" />
          Add customer
        </Button>
      </div>
    </div>
  )
}

function CustomersSelectionBar({
  onAction,
}: {
  onAction: (message: string) => void
}) {
  const { table } = useDataTable<Customer>()
  const selected = table.getFilteredSelectedRowModel().rows
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          onAction(`Emailed ${selected.length} customers`)
          table.resetRowSelection()
        }}
      >
        <Mail className="size-4" aria-hidden="true" />
        Email selected
      </Button>
    </DataTableSelectionBar>
  )
}

export default function CustomersTable() {
  const [customers, setCustomers] = React.useState(sampleCustomers)
  const [viewing, setViewing] = React.useState<Customer | null>(null)
  const [adding, setAdding] = React.useState(false)
  const [lastAction, setLastAction] = React.useState("")

  const cancelSubscription = React.useCallback((customer: Customer) => {
    const churned = {
      ...customer,
      status: "churned" as const,
      mrr: 0,
      mrrChange: 0,
      seatsUsed: 0,
    }
    setCustomers(rows =>
      rows.map(row => (row.id === customer.id ? churned : row)),
    )
    setViewing(current => (current?.id === customer.id ? churned : current))
    setLastAction(`Cancelled ${customer.name}'s subscription`)
  }, [])

  const addCustomer = React.useCallback((input: NewCustomer) => {
    setCustomers(rows => [
      {
        ...input,
        id: `cus_${(rows.length + 1).toString().padStart(3, "0")}`,
        status: "trial",
        mrr: 0,
        mrrChange: 0,
        seatsUsed: 1,
        signedUp: new Date(),
      },
      ...rows,
    ])
    setLastAction(`Added ${input.name} on a trial`)
  }, [])

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <ViewCustomerItem onView={setViewing} />
        <CopyEmailItem onCopied={c => setLastAction(`Copied ${c.email}`)} />
        <RowMenuSeparator />
        <CancelSubscriptionItem onCancel={cancelSubscription} />
      </>
    ),
    [cancelSubscription],
  )
  const columns = useCustomerColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={customers}
        columns={columns}
        getRowId={row => row.id}
        initialState={{ columnVisibility: { email: false } }}
      >
        <div className="flex flex-col gap-4">
          <CustomersHeader onAddCustomer={() => setAdding(true)} />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search customers..."
              className="min-w-48 flex-none sm:w-72"
            />
            <DataTableFacetedFilter accessorKey="status" multiple />
            <DataTableFacetedFilter accessorKey="plan" multiple />
            <DataTableClearFilter />
            <div className="ml-auto">
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <CustomersSelectionBar onAction={setLastAction} />
          <DataTable>
            <DataTableHeader />
            <DataTableBody<Customer> onRowClick={row => setViewing(row)}>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <Users className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No customers yet</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Add your first customer to see them here.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>
                    No matching customers
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
          <DataTablePagination />
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
      <CustomerSheet
        customer={viewing}
        onOpenChange={open => !open && setViewing(null)}
        onCancelSubscription={cancelSubscription}
      />
      <AddCustomerSheet
        open={adding}
        onOpenChange={setAdding}
        onAdd={addCustomer}
      />
    </div>
  )
}
