"use client"

import { useCallback, useState } from "react"
import type { ColumnSizingState } from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Order = {
  id: string
  customer: string
  email: string
  product: string
  amount: number
  status: "pending" | "shipped" | "delivered"
}

const data: Order[] = [
  {
    id: "ORD-001",
    customer: "John Doe",
    email: "john.doe@example.com",
    product: "Premium Widget",
    amount: 299.99,
    status: "delivered",
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    email: "jane.smith@example.com",
    product: "Basic Kit",
    amount: 149.5,
    status: "shipped",
  },
  {
    id: "ORD-003",
    customer: "Bob Johnson",
    email: "bob.johnson@example.com",
    product: "Pro Bundle",
    amount: 599.0,
    status: "pending",
  },
  {
    id: "ORD-004",
    customer: "Alice Williams",
    email: "alice.williams@example.com",
    product: "Starter Pack",
    amount: 79.99,
    status: "delivered",
  },
  {
    id: "ORD-005",
    customer: "Charlie Brown",
    email: "charlie.brown@example.com",
    product: "Enterprise Suite",
    amount: 1299.0,
    status: "shipped",
  },
]

const columns: DataTableColumnDef<Order>[] = [
  {
    accessorKey: "id",
    size: 110,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Order ID" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Order ID" },
  },
  {
    accessorKey: "customer",
    size: 160,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Customer" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Customer" },
  },
  {
    accessorKey: "email",
    size: 220,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Email" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Email" },
  },
  {
    accessorKey: "product",
    size: 180,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Product" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Product" },
  },
  {
    accessorKey: "status",
    size: 120,
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Status" />
      </DataTableColumnHeader>
    ),
    meta: { label: "Status" },
    cell: ({ row }) => (
      <Badge variant="secondary">{row.getValue("status")}</Badge>
    ),
  },
]

const STORAGE_KEY = "niko-table:column-resize-demo"

/**
 * Persist `columnSizing` to `localStorage`. Reads once on mount (so restored
 * widths win over auto-fit) and writes on every change. Swap `localStorage`
 * for your own store, such as a user-settings API.
 */
function usePersistedColumnSizing(storageKey: string) {
  const [columnSizing, setState] = useState<ColumnSizingState>(() => {
    if (typeof window === "undefined") return {}
    try {
      const raw = window.localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as ColumnSizingState) : {}
    } catch {
      return {}
    }
  })

  const setColumnSizing = useCallback(
    (
      updater:
        ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState),
    ) => {
      setState(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next))
        } catch {
          // Quota / private mode: drop persistence silently.
        }
        return next
      })
    },
    [storageKey],
  )

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore.
    }
    setState({})
  }, [storageKey])

  return { columnSizing, setColumnSizing, clear }
}

export default function ColumnResizePersistedTable() {
  const { columnSizing, setColumnSizing, clear } =
    usePersistedColumnSizing(STORAGE_KEY)

  const resizedCount = Object.keys(columnSizing).length

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Resize a column, then reload. Widths are restored from{" "}
          <code>localStorage</code>. On first load, before anything is saved,
          the columns auto-fit to the container width.
        </p>
        <Button variant="outline" size="sm" onClick={clear}>
          Reset widths
        </Button>
      </div>

      <DataTableRoot
        data={data}
        columns={columns}
        state={{ columnSizing }}
        onColumnSizingChange={setColumnSizing}
      >
        <DataTableColumnResize />
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
      </DataTableRoot>

      <p className="text-xs text-muted-foreground">
        {resizedCount > 0
          ? `${resizedCount} column widths saved.`
          : "No widths saved yet. Showing the auto-fit layout."}
      </p>
    </div>
  )
}
