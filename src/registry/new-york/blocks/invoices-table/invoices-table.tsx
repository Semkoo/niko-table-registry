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
import {
  DataTableGroupedRows,
  useDataTableGroupRow,
} from "@/components/niko-table/components/data-table-grouped-rows"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnActions } from "@/components/niko-table/components/data-table-column-actions"
import {
  DataTableColumnSortMenu,
  DataTableColumnSortOptions,
} from "@/components/niko-table/components/data-table-column-sort"
import { DataTableColumnGroupOptions } from "@/components/niko-table/components/data-table-column-group"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableDateFilter } from "@/components/niko-table/components/data-table-date-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TableCell } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CheckCheck,
  ChevronRight,
  FileText,
  Layers,
  MoreHorizontal,
  SearchX,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  canMarkPaid,
  canVoid,
  invoices as sampleInvoices,
  statusOptions,
  statusRank,
  TODAY,
  type Invoice,
  type InvoiceStatus,
} from "./invoices-data"
import {
  dueStyle,
  formatDate,
  formatDue,
  formatMoney,
  invoiceLink,
  statusStyle,
} from "./invoices-format"

type Actions = {
  markPaid: (list: Invoice[]) => void
  remind: (invoice: Invoice) => void
  copyLink: (invoice: Invoice) => void
  voidInvoices: (list: Invoice[]) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `InvoicesTable` composes them into ONE fragment that both the "⋯" dropdown
 * and the right-click menu render.
 */
function MarkPaidItem({ markPaid }: Pick<Actions, "markPaid">) {
  const invoice = useDataTableRow<Invoice>()
  return (
    <RowMenuItem
      disabled={!canMarkPaid(invoice)}
      onClick={() => markPaid([invoice])}
    >
      Mark as paid
    </RowMenuItem>
  )
}

function SendReminderItem({ remind }: Pick<Actions, "remind">) {
  const invoice = useDataTableRow<Invoice>()
  return (
    <RowMenuItem
      disabled={!canMarkPaid(invoice)}
      onClick={() => remind(invoice)}
    >
      Send reminder
    </RowMenuItem>
  )
}

function CopyLinkItem({ copyLink }: Pick<Actions, "copyLink">) {
  const invoice = useDataTableRow<Invoice>()
  return (
    <RowMenuItem onClick={() => copyLink(invoice)}>
      Copy invoice link
    </RowMenuItem>
  )
}

function VoidItem({ voidInvoices }: Pick<Actions, "voidInvoices">) {
  const invoice = useDataTableRow<Invoice>()
  return (
    <RowMenuItem
      variant="destructive"
      disabled={!canVoid(invoice)}
      onClick={() => voidInvoices([invoice])}
    >
      Void invoice
    </RowMenuItem>
  )
}

/*
 * The group row: chevron, status, "N invoices", and the summed amount lined up
 * under the Amount column. The built-in row says "rows" and shows the group in
 * the (narrow) status column, so this one spans the leading columns instead.
 */
function StatusGroupRow() {
  const { row, groupLabel, count, isExpanded, toggle } =
    useDataTableGroupRow<Invoice>()
  const cells = row.getVisibleCells()
  const amountAt = cells.findIndex(cell => cell.column.id === "amount")
  const lead = amountAt === -1 ? cells.length : amountAt
  const tail = amountAt === -1 ? 0 : cells.length - amountAt - 1
  const status = groupLabel as InvoiceStatus
  return (
    <>
      <TableCell colSpan={lead}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} the ${groupLabel} group`}
            onClick={event => {
              event.stopPropagation()
              toggle()
            }}
          >
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
          </Button>
          <Badge
            variant="outline"
            className={cn("capitalize", statusStyle[status])}
          >
            {status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {`· ${count} ${count === 1 ? "invoice" : "invoices"}`}
          </span>
        </div>
      </TableCell>
      {amountAt !== -1 && (
        <TableCell className="text-right font-medium tabular-nums">
          {formatMoney(Number(row.getValue("amount")))}
        </TableCell>
      )}
      {tail > 0 && <TableCell colSpan={tail} />}
    </>
  )
}

function statusHeader() {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
      <DataTableColumnActions>
        <DataTableColumnSortOptions />
        <DataTableColumnGroupOptions />
      </DataTableColumnActions>
    </DataTableColumnHeader>
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

function useInvoiceColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Invoice>[]>(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.SELECT,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableGrouping: false,
        header: ({ table }) => (
          <Checkbox
            // Plain boolean: Radix and Base UI checkboxes take indeterminate differently.
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all invoices on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label={`Select invoice ${row.original.number}`}
          />
        ),
      },
      {
        id: "number",
        // Search reads this value, so it matches the number, customer and email.
        accessorFn: invoice =>
          `${invoice.number} ${invoice.customer} ${invoice.email}`,
        meta: { label: "Invoice" },
        enableGrouping: false,
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <span className="font-mono text-xs">{row.original.number}</span>
            <span className="truncate text-sm text-muted-foreground">
              {row.original.customer}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "issuedAt",
        meta: { label: "Issued" },
        enableGrouping: false,
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatDate(row.original.issuedAt)}
          </span>
        ),
      },
      {
        accessorKey: "dueAt",
        meta: { label: "Due", variant: "dateRange" },
        enableGrouping: false,
        enableColumnFilter: true,
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex flex-col whitespace-nowrap">
            <span className="tabular-nums">
              {formatDate(row.original.dueAt)}
            </span>
            <span className={cn("text-xs", dueStyle(row.original))}>
              {formatDue(row.original)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "amount",
        size: 130,
        meta: { label: "Amount" },
        enableGrouping: false,
        // Summed per group; the group row below reads it with row.getValue.
        aggregationFn: "sum",
        header: () => (
          <DataTableColumnHeader className="justify-end">
            <DataTableColumnTitle />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="text-right font-medium tabular-nums">
            {formatMoney(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status", options: statusOptions },
        enableColumnFilter: true,
        header: statusHeader,
        // Groups and sorts by what needs attention first, not alphabetically.
        // Group rows have no `original`, so read the value instead.
        sortingFn: (
          a: { getValue: (id: string) => unknown },
          b: { getValue: (id: string) => unknown },
        ) =>
          statusRank[a.getValue("status") as InvoiceStatus] -
          statusRank[b.getValue("status") as InvoiceStatus],
        cell: ({ getValue }) => {
          const status = getValue() as InvoiceStatus
          return (
            <Badge
              variant="outline"
              className={cn("capitalize", statusStyle[status])}
            >
              {status}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        enableGrouping: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for invoice ${row.original.number}`}
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

function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-col gap-0.5 rounded-lg border bg-background px-3 py-2"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-base font-semibold tabular-nums", tone)}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{note}</span>
    </div>
  )
}

/** Totals for the invoices that match the current filters. */
function InvoicesSummary() {
  const { table } = useDataTable<Invoice>()
  const rows = table.getFilteredRowModel().rows.map(row => row.original)
  const total = (list: Invoice[]) =>
    formatMoney(list.reduce((sum, invoice) => sum + invoice.amount, 0))
  const count = (list: Invoice[]) =>
    `${list.length} ${list.length === 1 ? "invoice" : "invoices"}`

  const outstanding = rows.filter(canMarkPaid)
  const overdue = rows.filter(invoice => invoice.status === "overdue")
  const paidThisMonth = rows.filter(
    invoice =>
      invoice.paidAt !== null &&
      invoice.paidAt.getUTCFullYear() === TODAY.getUTCFullYear() &&
      invoice.paidAt.getUTCMonth() === TODAY.getUTCMonth(),
  )
  const drafts = rows.filter(invoice => invoice.status === "draft")

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat
        label="Outstanding"
        value={total(outstanding)}
        note={count(outstanding)}
      />
      <Stat
        label="Overdue"
        value={total(overdue)}
        note={count(overdue)}
        tone={overdue.length > 0 ? "text-destructive" : undefined}
      />
      <Stat
        label="Paid this month"
        value={total(paidThisMonth)}
        note={count(paidThisMonth)}
      />
      <Stat label="Drafts" value={total(drafts)} note={count(drafts)} />
    </div>
  )
}

/** Turns grouping by status on and off. While ungrouped, the Status column menu can also turn it on. */
function GroupToggle() {
  const { table } = useDataTable<Invoice>()
  const grouped = table.state.grouping.length > 0
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8"
      aria-pressed={grouped}
      onClick={() => table.setGrouping(grouped ? [] : ["status"])}
    >
      <Layers className="size-4" aria-hidden="true" />
      Group by status
    </Button>
  )
}

function InvoicesSelectionBar({ markPaid }: Pick<Actions, "markPaid">) {
  const { table } = useDataTable<Invoice>()
  const selected = table.getFilteredSelectedRowModel().rows
  const payable = selected.filter(row => canMarkPaid(row.original))
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={payable.length === 0}
        onClick={() => {
          markPaid(payable.map(row => row.original))
          table.resetRowSelection()
        }}
      >
        <CheckCheck className="size-4" aria-hidden="true" />
        Mark as paid
      </Button>
    </DataTableSelectionBar>
  )
}

export default function InvoicesTable() {
  const [invoices, setInvoices] = React.useState(sampleInvoices)
  const [lastAction, setLastAction] = React.useState("")

  const update = React.useCallback(
    (ids: string[], change: (invoice: Invoice) => Invoice) =>
      setInvoices(rows =>
        rows.map(row => (ids.includes(row.id) ? change(row) : row)),
      ),
    [],
  )

  const actions = React.useMemo<Actions>(() => {
    const label = (list: Invoice[]) =>
      list.length === 1 ? list[0]?.number : `${list.length} invoices`
    return {
      markPaid: list => {
        update(
          list.map(invoice => invoice.id),
          invoice => ({
            ...invoice,
            status: "paid",
            paidAt: TODAY,
          }),
        )
        setLastAction(`${label(list)} marked as paid`)
      },
      remind: invoice =>
        setLastAction(
          `Reminder sent to ${invoice.email} for ${invoice.number}`,
        ),
      copyLink: invoice => {
        // Clipboard can be blocked (insecure origin, permissions); the note still shows the link.
        void navigator.clipboard
          ?.writeText(invoiceLink(invoice.number))
          ?.catch(() => undefined)
        setLastAction(`Copied ${invoiceLink(invoice.number)}`)
      },
      // Voiding keeps the record: the invoice moves to a "void" status (its own
      // group) instead of disappearing, so the invoice number is never reused.
      voidInvoices: list => {
        update(
          list.map(invoice => invoice.id),
          invoice => ({ ...invoice, status: "void" }),
        )
        setLastAction(`${label(list)} voided`)
      },
    }
  }, [update])

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <MarkPaidItem markPaid={actions.markPaid} />
        <SendReminderItem remind={actions.remind} />
        <CopyLinkItem copyLink={actions.copyLink} />
        <RowMenuSeparator />
        <VoidItem voidInvoices={actions.voidInvoices} />
      </>
    ),
    [actions],
  )
  const columns = useInvoiceColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={invoices}
        columns={columns}
        getRowId={invoice => invoice.id}
        // One page holds every group; group rows count toward the page size.
        // "remove" drops Status while grouped (the group row shows it); it comes back when ungrouped.
        config={{ initialPageSize: 50, groupedColumnMode: "remove" }}
        initialState={{
          // Grouped by status from the start; the toggle turns it off.
          grouping: ["status"],
          expanded: true,
          sorting: [{ id: "status", desc: false }],
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">Invoices</h2>
            <p className="text-sm text-muted-foreground">
              Amounts are in USD. Figures follow the filters.
            </p>
          </div>
          <InvoicesSummary />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search invoices..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="status" multiple />
            <DataTableDateFilter accessorKey="dueAt" multiple />
            {/* Sorting has a default (by status), so Reset only clears filters. */}
            <DataTableClearFilter enableResetSorting={false} />
            <div className="ml-auto flex items-center gap-2">
              <GroupToggle />
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <InvoicesSelectionBar markPaid={actions.markPaid} />
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              {/* Composing this is the whole grouping opt-in. */}
              <DataTableGroupedRows>
                <StatusGroupRow />
              </DataTableGroupedRows>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <FileText className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No invoices yet</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    New invoices show up here.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>
                    No matching invoices
                  </DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
          <DataTablePagination defaultPageSize={50} />
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
    </div>
  )
}
