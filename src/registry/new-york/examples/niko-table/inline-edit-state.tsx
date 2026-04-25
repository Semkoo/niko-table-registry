"use client"

/**
 * Inline Edit Table — controlled state variant.
 *
 * This file shows how to extract inline-edit logic into a reusable hook and
 * wire it into the table with full controlled state for pagination, sorting,
 * and column visibility.
 */

import * as React from "react"
import type {
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
  DataTableEmptyBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pencil, Check, X, PackageSearch, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
}

type EditDraft = { name: string; price: string }
type EditErrors = { name?: string; price?: string }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const initialData: Product[] = [
  {
    id: "1",
    name: "Wireless Headphones",
    category: "Electronics",
    price: 79.99,
    stock: 120,
  },
  {
    id: "2",
    name: "Running Shoes",
    category: "Sports",
    price: 59.99,
    stock: 85,
  },
  {
    id: "3",
    name: "Coffee Maker",
    category: "Appliances",
    price: 49.99,
    stock: 200,
  },
  { id: "4", name: "Yoga Mat", category: "Sports", price: 29.99, stock: 310 },
  {
    id: "5",
    name: "Desk Lamp",
    category: "Furniture",
    price: 39.99,
    stock: 150,
  },
  {
    id: "6",
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: 89.99,
    stock: 65,
  },
  {
    id: "7",
    name: "Water Bottle",
    category: "Sports",
    price: 19.99,
    stock: 400,
  },
  {
    id: "8",
    name: "Air Purifier",
    category: "Appliances",
    price: 129.99,
    stock: 40,
  },
]

// ---------------------------------------------------------------------------
// useInlineEdit — reusable inline-edit hook
// ---------------------------------------------------------------------------

function useInlineEdit(
  setData: React.Dispatch<React.SetStateAction<Product[]>>,
) {
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<EditDraft>({ name: "", price: "" })
  const [errors, setErrors] = React.useState<EditErrors>({})

  const startEditing = React.useCallback((product: Product) => {
    setEditingId(product.id)
    setDraft({ name: product.name, price: String(product.price) })
    setErrors({})
  }, [])

  const cancel = React.useCallback(() => {
    setEditingId(null)
    setDraft({ name: "", price: "" })
    setErrors({})
  }, [])

  const setField = React.useCallback(
    (field: keyof EditDraft, value: string) => {
      setDraft(prev => ({ ...prev, [field]: value }))
      setErrors(prev => ({ ...prev, [field]: undefined }))
    },
    [],
  )

  const save = React.useCallback(() => {
    const next: EditErrors = {}
    if (!draft.name.trim()) next.name = "Name is required"
    const parsed = parseFloat(draft.price)
    if (isNaN(parsed) || parsed <= 0) next.price = "Enter a positive price"
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }
    setData(prev =>
      prev.map(p =>
        p.id === editingId
          ? { ...p, name: draft.name.trim(), price: parsed }
          : p,
      ),
    )
    cancel()
  }, [draft, editingId, cancel, setData])

  /**
   * getRowMemoKey — composable row-invalidation bridge.
   *
   * This is the key integration point between external state and the
   * React.memo'd body rows inside DataTableBody.
   *
   * How it works:
   *  1. All six body variants (DataTableBody, DataTableVirtualizedBody, etc.)
   *     accept `getRowMemoKey?: (row: TData) => string`.
   *  2. Internally, each memoized BodyRow receives the returned string as a
   *     `rowMemoKey` prop. React.memo compares it like any other prop.
   *  3. When you type in the name input, `draft.name` changes → this callback
   *     returns a new string for the editing row → React.memo re-renders only
   *     that row. Every other row keeps `""` and is skipped.
   *
   * Composable means you can combine multiple sources of external state:
   *
   *   const getRowMemoKey = useCallback((row: Product) =>
   *     [
   *       inlineEdit.getRowMemoKey(row),   // edit drafts + errors
   *       savingIds.has(row.id) ? "saving" : "",  // in-flight mutations
   *       optimisticOverlay(row.id),       // any other per-row state
   *     ].join("||"),
   *   [inlineEdit.getRowMemoKey, savingIds, optimisticOverlay])
   */
  const getRowMemoKey = React.useCallback(
    (row: Product): string => {
      if (row.id !== editingId) return ""
      return `${draft.name}|${draft.price}|${errors.name ?? ""}|${errors.price ?? ""}`
    },
    [editingId, draft, errors],
  )

  return {
    editingId,
    draft,
    errors,
    startEditing,
    cancel,
    setField,
    save,
    getRowMemoKey,
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function InlineEditStateTable() {
  const [data, setData] = React.useState<Product[]>(initialData)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const inlineEdit = useInlineEdit(setData)

  const columns = React.useMemo<DataTableColumnDef<Product>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <DataTableColumnTitle>Name</DataTableColumnTitle>
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const isEditing = row.original.id === inlineEdit.editingId
          if (!isEditing)
            return <span className="font-medium">{row.original.name}</span>
          return (
            <div className="space-y-1">
              <Input
                value={inlineEdit.draft.name}
                onChange={e => inlineEdit.setField("name", e.target.value)}
                className={cn(
                  "h-7 w-48 text-sm",
                  inlineEdit.errors.name && "border-destructive",
                )}
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter") inlineEdit.save()
                  if (e.key === "Escape") inlineEdit.cancel()
                }}
              />
              {inlineEdit.errors.name && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {inlineEdit.errors.name}
                </p>
              )}
            </div>
          )
        },
        meta: { label: "Name" },
        enableGlobalFilter: true,
      },
      {
        id: "category",
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <DataTableColumnTitle>Category</DataTableColumnTitle>
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.category}</Badge>
        ),
        meta: { label: "Category" },
        enableGlobalFilter: true,
      },
      {
        id: "price",
        accessorKey: "price",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <DataTableColumnTitle>Price</DataTableColumnTitle>
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const isEditing = row.original.id === inlineEdit.editingId
          if (!isEditing)
            return (
              <span className="tabular-nums">
                ${row.original.price.toFixed(2)}
              </span>
            )
          return (
            <div className="space-y-1">
              <div className="relative w-28">
                <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  value={inlineEdit.draft.price}
                  onChange={e => inlineEdit.setField("price", e.target.value)}
                  className={cn(
                    "h-7 pl-5 text-sm tabular-nums",
                    inlineEdit.errors.price && "border-destructive",
                  )}
                  type="number"
                  min={0}
                  step={0.01}
                  onKeyDown={e => {
                    if (e.key === "Enter") inlineEdit.save()
                    if (e.key === "Escape") inlineEdit.cancel()
                  }}
                />
              </div>
              {inlineEdit.errors.price && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {inlineEdit.errors.price}
                </p>
              )}
            </div>
          )
        },
        meta: { label: "Price" },
      },
      {
        id: "stock",
        accessorKey: "stock",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            <DataTableColumnTitle>Stock</DataTableColumnTitle>
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.stock}</span>
        ),
        meta: { label: "Stock" },
      },
      {
        id: SYSTEM_COLUMN_IDS.ACTIONS,
        cell: ({ row }) => {
          const isEditing = row.original.id === inlineEdit.editingId
          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={inlineEdit.save}
                  title="Save"
                >
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={inlineEdit.cancel}
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5 text-red-600" />
                </Button>
              </div>
            )
          }
          return (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover/row:opacity-100 focus:opacity-100"
              onClick={() => inlineEdit.startEditing(row.original)}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )
        },
      },
    ],
    // Columns capture inlineEdit callbacks. Because the hook returns stable
    // callbacks (useCallback), this memo only re-runs when edit state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inlineEdit.editingId, inlineEdit.draft, inlineEdit.errors],
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Edit state</CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">
          {inlineEdit.editingId ? (
            <span>
              Editing <strong>{inlineEdit.editingId}</strong> —{" "}
              {JSON.stringify(inlineEdit.draft)}
            </span>
          ) : (
            "No row being edited"
          )}
        </CardContent>
      </Card>

      <DataTableRoot
        data={data}
        columns={columns}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
      >
        <DataTable>
          <DataTableToolbarSection>
            <DataTableSearchFilter placeholder="Search products…" />
            <DataTableViewMenu />
          </DataTableToolbarSection>
          <DataTableHeader />
          <DataTableBody getRowMemoKey={inlineEdit.getRowMemoKey} />
          <DataTableEmptyBody>
            <DataTableEmptyMessage>
              <DataTableEmptyIcon>
                <PackageSearch />
              </DataTableEmptyIcon>
              <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
              <DataTableEmptyDescription>
                Try adjusting your search.
              </DataTableEmptyDescription>
            </DataTableEmptyMessage>
          </DataTableEmptyBody>
          <DataTablePagination />
        </DataTable>
      </DataTableRoot>
    </div>
  )
}
