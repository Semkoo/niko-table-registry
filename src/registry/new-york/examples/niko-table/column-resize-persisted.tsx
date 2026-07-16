"use client"

import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnResize } from "@/components/niko-table/components/data-table-column-resize"
import { useColumnSizingPersistence } from "@/components/niko-table/lib/use-column-sizing-persistence"
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

export default function ColumnResizePersistedTable() {
  // Opt-in persistence: wire the returned columnSizing + onColumnSizingChange
  // into DataTableRoot and resized widths survive a reload.
  const { columnSizing, onColumnSizingChange, resetColumnSizing } =
    useColumnSizingPersistence(STORAGE_KEY)

  const resizedCount = Object.keys(columnSizing).length

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Resize a column, then reload. Widths are restored from{" "}
          <code>localStorage</code>. On first load, before anything is saved,
          the columns fill the container width.
        </p>
        <Button variant="outline" size="sm" onClick={resetColumnSizing}>
          Reset widths
        </Button>
      </div>

      <DataTableRoot
        data={data}
        columns={columns}
        state={{ columnSizing }}
        onColumnSizingChange={onColumnSizingChange}
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
