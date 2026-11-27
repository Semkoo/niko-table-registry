"use client"

import * as React from "react"
import type { ColumnFiltersState, Updater } from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTableVirtualizedHeader,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
} from "@/components/niko-table/lib/constants"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
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
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import { Landmark, MoreHorizontal, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  categoryOptions,
  fetchTransactions,
  PAGE_SIZE,
  queryTransactions,
  typeOptions,
  type Transaction,
  type TransactionCategory,
  type TransactionPage,
  type TransactionQuery,
} from "./transactions-data"
import {
  amountStyle,
  formatClock,
  formatDay,
  formatMoney,
  formatSigned,
  sameDay,
} from "./transactions-format"
import { TransactionSheet } from "./transaction-sheet"

// Row height = cell p-2 (16px) + tallest cell (description + account, 20px + 16px line heights = 36px) + 1px border-b. Change one, change all.
const ROW_HEIGHT = 53
const SEARCH_DEBOUNCE_MS = 300

type Actions = {
  view: (transaction: Transaction) => void
  copyId: (transaction: Transaction) => void
  onlyCategory: (transaction: Transaction) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `TransactionsTable` composes them into ONE fragment that both the "⋯"
 * dropdown and the right-click menu render.
 */
function ViewDetailsItem({ view }: Pick<Actions, "view">) {
  const transaction = useDataTableRow<Transaction>()
  return (
    <RowMenuItem onClick={() => view(transaction)}>View details</RowMenuItem>
  )
}

function CopyTransactionIdItem({ copyId }: Pick<Actions, "copyId">) {
  const transaction = useDataTableRow<Transaction>()
  return (
    <RowMenuItem onClick={() => copyId(transaction)}>
      Copy transaction ID
    </RowMenuItem>
  )
}

function ShowOnlyCategoryItem({ onlyCategory }: Pick<Actions, "onlyCategory">) {
  const transaction = useDataTableRow<Transaction>()
  const { table } = useDataTable<Transaction>()
  const current = selectedValues(table.state.columnFilters, "category")
  const already = current.length === 1 && current[0] === transaction.category
  return (
    <RowMenuItem disabled={already} onClick={() => onlyCategory(transaction)}>
      Show only {transaction.category}
    </RowMenuItem>
  )
}

/** The values a faceted filter holds for one column. */
function selectedValues(filters: ColumnFiltersState, id: string): string[] {
  const inner = (
    filters.find(f => f.id === id)?.value as { value?: unknown } | undefined
  )?.value
  return Array.isArray(inner) ? inner.map(String) : []
}

/** Same shape the toolbar's faceted filter writes, so both stay in sync. */
function categoryFilter(category: TransactionCategory) {
  return {
    id: "category",
    value: {
      id: "category",
      value: [category],
      variant: FILTER_VARIANTS.MULTI_SELECT,
      operator: FILTER_OPERATORS.IN,
      filterId: "faceted-category",
      joinOperator: JOIN_OPERATORS.AND,
    },
  }
}

function plainHeader() {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
    </DataTableColumnHeader>
  )
}

function rightHeader() {
  return (
    <DataTableColumnHeader className="justify-end">
      <DataTableColumnTitle />
    </DataTableColumnHeader>
  )
}

function useTransactionColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: "date",
        meta: { label: "Date" },
        header: plainHeader,
        size: 130,
        enableSorting: false,
        cell: ({ row, table }) => {
          // Show the day once, then a lighter time for the rest of that day.
          const previous = table.getRowModel().rows[row.index - 1]?.original
          const first = !previous || !sameDay(previous, row.original)
          return (
            <span className="flex flex-col leading-tight whitespace-nowrap">
              <span
                className={cn(
                  "text-sm",
                  first ? "font-medium" : "text-muted-foreground",
                )}
              >
                {formatDay(row.original.date)}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatClock(row.original.date)} UTC
              </span>
            </span>
          )
        },
      },
      {
        accessorKey: "description",
        meta: { label: "Description" },
        header: plainHeader,
        size: 300,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex max-w-72 flex-col">
            <span className="truncate text-sm">{row.original.description}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.account}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "category",
        meta: { label: "Category", options: categoryOptions },
        header: plainHeader,
        size: 120,
        enableSorting: false,
        enableColumnFilter: true,
        enableGlobalFilter: false,
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.category}</Badge>
        ),
      },
      {
        accessorKey: "type",
        // Hidden: backs the Type filter.
        meta: { label: "Type", options: typeOptions },
        enableColumnFilter: true,
        enableHiding: false,
        enableSorting: false,
        enableGlobalFilter: false,
      },
      {
        accessorKey: "amount",
        meta: { label: "Amount" },
        size: 130,
        enableSorting: false,
        enableGlobalFilter: false,
        header: rightHeader,
        cell: ({ row }) => (
          <span
            className={cn(
              "block text-right text-sm font-medium whitespace-nowrap tabular-nums",
              amountStyle(row.original),
            )}
          >
            {formatSigned(row.original.amount)}
          </span>
        ),
      },
      {
        accessorKey: "balance",
        meta: { label: "Balance" },
        size: 130,
        enableSorting: false,
        enableGlobalFilter: false,
        header: rightHeader,
        cell: ({ row }) => (
          <span className="block text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums">
            {formatMoney(row.original.balance)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },
        header: plainHeader,
        size: 100,
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <Badge variant="outline" className="border-warning/40 text-warning">
              Pending
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Posted</span>
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
                  className="size-6"
                  aria-label={`Open actions for transaction ${row.original.id}`}
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
  tone,
}: {
  label: string
  value: string
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-base font-semibold tabular-nums", tone)}>
        {value}
      </span>
    </div>
  )
}

/** Debounces a value so typing and filter clicks make one request. */
function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

type Loaded = TransactionPage & {
  /** The query these rows answer. Paging continues with the same one. */
  query: Omit<TransactionQuery, "cursor">
  rows: Transaction[]
}

const firstQuery = { limit: PAGE_SIZE, search: "", category: [], type: [] }

export default function TransactionsTable() {
  // The first page is ready on mount; later pages come from the fake server.
  const [loaded, setLoaded] = React.useState<Loaded>(() => ({
    ...queryTransactions({ ...firstQuery, cursor: 0 }),
    query: firstQuery,
  }))
  const [fetching, setFetching] = React.useState<"more" | "filters" | null>(
    null,
  )
  const [search, setSearch] = React.useState<string | object>("")
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [viewing, setViewing] = React.useState<Transaction | null>(null)
  const [lastAction, setLastAction] = React.useState("")

  // Ignore any response that is not for the newest request.
  const requestId = React.useRef(0)
  // Set while a page is in flight, so a fast scroll cannot load it twice.
  const busy = React.useRef(false)
  // An end-of-list signal that arrived while busy; runs when the request settles.
  const pendingMore = React.useRef(false)
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const input = React.useMemo(
    () => ({
      search: typeof search === "string" ? search : "",
      category: selectedValues(columnFilters, "category"),
      type: selectedValues(columnFilters, "type"),
    }),
    [search, columnFilters],
  )
  const wanted = useDebounced(input, SEARCH_DEBOUNCE_MS)
  // Key on the content, so a re-created but equal filter never refetches.
  const queryKey = JSON.stringify({ limit: PAGE_SIZE, ...wanted })
  const query = React.useMemo(
    () => JSON.parse(queryKey) as Omit<TransactionQuery, "cursor">,
    [queryKey],
  )
  const shownKey = React.useRef(JSON.stringify(firstQuery))

  // A rejected request must not leave "Loading more…" stuck.
  const fail = React.useCallback((id: number) => {
    if (id !== requestId.current) return
    busy.current = false
    setFetching(null)
    setLastAction("Could not load transactions")
  }, [])

  // Filters changed: start over from the first page.
  React.useEffect(() => {
    if (shownKey.current === queryKey) {
      // Back to what is on screen: drop any request still in flight.
      requestId.current++
      busy.current = false
      setFetching(null)
      return
    }
    const id = ++requestId.current
    busy.current = true
    setFetching("filters")
    void fetchTransactions({ ...query, cursor: 0 }).then(
      page => {
        if (id !== requestId.current) return
        shownKey.current = queryKey
        busy.current = false
        pendingMore.current = false
        setLoaded({ ...page, query })
        setFetching(null)
        // New list: start at the top so the old offset cannot trigger a page.
        const scroller = bodyRef.current?.querySelector<HTMLElement>(
          '[data-slot="table-container"]',
        )
        if (scroller) scroller.scrollTop = 0
      },
      () => fail(id),
    )
  }, [queryKey, query, fail])

  // Scrolling near the end calls this. The footer button calls it too.
  const loadMore = React.useCallback(() => {
    if (loaded.nextCursor === null) return
    if (busy.current) {
      // onNearEnd fires once per approach, so remember it instead of dropping it.
      pendingMore.current = true
      return
    }
    const id = requestId.current
    busy.current = true
    setFetching("more")
    void fetchTransactions({ ...loaded.query, cursor: loaded.nextCursor }).then(
      page => {
        if (id !== requestId.current) return
        busy.current = false
        setLoaded(prev => ({
          ...page,
          query: prev.query,
          rows: [...prev.rows, ...page.rows],
        }))
        setFetching(null)
      },
      () => fail(id),
    )
  }, [loaded.nextCursor, loaded.query, fail])

  React.useEffect(() => {
    if (fetching === null && pendingMore.current) {
      pendingMore.current = false
      loadMore()
    }
  }, [fetching, loadMore])

  const actions = React.useMemo<Actions>(
    () => ({
      view: transaction => setViewing(transaction),
      copyId: transaction => {
        void navigator.clipboard?.writeText(transaction.id).catch(() => {})
        setLastAction(`Copied ${transaction.id}`)
      },
      onlyCategory: transaction => {
        setColumnFilters(prev => [
          ...prev.filter(f => f.id !== "category"),
          categoryFilter(transaction.category),
        ])
        setLastAction(`Showing only ${transaction.category}`)
      },
    }),
    [],
  )

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <ViewDetailsItem view={actions.view} />
        <CopyTransactionIdItem copyId={actions.copyId} />
        <ShowOnlyCategoryItem onlyCategory={actions.onlyCategory} />
      </>
    ),
    [actions],
  )
  const columns = useTransactionColumns(rowMenu)

  const done = loaded.nextCursor === null
  const footer =
    fetching === "more"
      ? "Loading more…"
      : fetching === "filters"
        ? "Updating…"
        : done
          ? "End of list"
          : ""

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={loaded.rows}
        columns={columns}
        getRowId={transaction => transaction.id}
        config={{ manualFiltering: true }}
        state={{ globalFilter: search, columnFilters }}
        onGlobalFilterChange={setSearch}
        onColumnFiltersChange={(updater: Updater<ColumnFiltersState>) =>
          setColumnFilters(updater)
        }
        initialState={{ columnVisibility: { type: false } }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-semibold">Transactions</h2>
            <p className="text-sm text-muted-foreground">
              Loaded {loaded.rows.length.toLocaleString("en-US")} of{" "}
              {loaded.total.toLocaleString("en-US")}. More load as you scroll.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Stat
              label="Money in"
              value={formatSigned(loaded.moneyIn)}
              tone="text-success"
            />
            <Stat label="Money out" value={formatSigned(loaded.moneyOut)} />
            <Stat label="Current balance" value={formatMoney(loaded.balance)} />
          </div>
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search description, ID or account..."
              className="min-w-48 flex-none sm:w-72"
            />
            {/* Static options, no counts: the server holds the rows, so the loaded rows would hide options and give wrong numbers. */}
            <DataTableFacetedFilter
              accessorKey="category"
              options={categoryOptions}
              multiple
              showCounts={false}
            />
            <DataTableFacetedFilter
              accessorKey="type"
              options={typeOptions}
              multiple
              showCounts={false}
            />
            <DataTableClearFilter />
          </DataTableToolbarSection>
          {/* 20,000 transactions on the server, 100 per page, windowed here. */}
          <div ref={bodyRef}>
            <DataTable
              height={560}
              className={cn(
                "rounded-lg border",
                fetching === "filters" && "opacity-60",
              )}
            >
              <DataTableVirtualizedHeader />
              <DataTableVirtualizedBody<Transaction>
                estimateSize={ROW_HEIGHT}
                fixedRowHeight
                prefetchThreshold={15}
                onNearEnd={loadMore}
                onRowClick={transaction => setViewing(transaction)}
              >
                <DataTableRowContextMenuSlot>
                  {rowMenu}
                </DataTableRowContextMenuSlot>
                <DataTableVirtualizedEmptyBody>
                  <DataTableEmptyMessage>
                    <DataTableEmptyIcon>
                      <Landmark className="size-12" />
                    </DataTableEmptyIcon>
                    <DataTableEmptyTitle>
                      No transactions yet
                    </DataTableEmptyTitle>
                    <DataTableEmptyDescription>
                      Money in and out shows up here.
                    </DataTableEmptyDescription>
                  </DataTableEmptyMessage>
                  <DataTableEmptyFilteredMessage>
                    <DataTableEmptyIcon>
                      <SearchX className="size-12" />
                    </DataTableEmptyIcon>
                    <DataTableEmptyTitle>
                      No matching transactions
                    </DataTableEmptyTitle>
                    <DataTableEmptyDescription>
                      Try a different search or clear the filters.
                    </DataTableEmptyDescription>
                  </DataTableEmptyFilteredMessage>
                </DataTableVirtualizedEmptyBody>
              </DataTableVirtualizedBody>
            </DataTable>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <p aria-live="polite">{footer}</p>
            {!done && fetching === null && (
              <Button variant="ghost" size="sm" onClick={loadMore}>
                Load more
              </Button>
            )}
          </div>
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
      <TransactionSheet
        transaction={viewing}
        onOpenChange={open => !open && setViewing(null)}
        onCopyId={actions.copyId}
      />
    </div>
  )
}
