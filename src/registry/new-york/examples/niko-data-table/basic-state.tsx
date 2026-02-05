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
  DataTableViewMenu,
  DataTablePagination,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-data-table"
import {
  DataTableColumnHeader,
  DataTableColumnTitle,
  DataTableColumnSortMenu,
} from "@/components/niko-data-table/components"
import { FILTER_VARIANTS } from "@/components/niko-data-table/lib"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
}

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    meta: {
      label: "Product",
      variant: FILTER_VARIANTS.SELECT,
    },
  },
  {
    accessorKey: "category",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
  },
  {
    accessorKey: "price",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return <div className="font-medium">${price.toFixed(2)}</div>
    },
  },
  {
    accessorKey: "stock",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
      </DataTableColumnHeader>
    ),
  },
]

const data: Product[] = [
  { id: "1", name: "Laptop", category: "Electronics", price: 999, stock: 50 },
  { id: "2", name: "Mouse", category: "Electronics", price: 29, stock: 150 },
  { id: "3", name: "Keyboard", category: "Electronics", price: 79, stock: 80 },
  { id: "4", name: "Monitor", category: "Electronics", price: 299, stock: 40 },
  {
    id: "5",
    name: "Headphones",
    category: "Electronics",
    price: 149,
    stock: 70,
  },
  { id: "6", name: "Tablet", category: "Electronics", price: 599, stock: 30 },
  {
    id: "7",
    name: "Smartphone",
    category: "Electronics",
    price: 799,
    stock: 25,
  },
  { id: "8", name: "Webcam", category: "Electronics", price: 89, stock: 60 },
  { id: "9", name: "Speaker", category: "Electronics", price: 199, stock: 45 },
  { id: "10", name: "Printer", category: "Electronics", price: 159, stock: 20 },
  { id: "11", name: "Router", category: "Electronics", price: 119, stock: 35 },
  {
    id: "12",
    name: "Hard Drive",
    category: "Electronics",
    price: 129,
    stock: 55,
  },
  {
    id: "13",
    name: "Graphics Card",
    category: "Electronics",
    price: 699,
    stock: 15,
  },
  { id: "14", name: "RAM", category: "Electronics", price: 99, stock: 90 },
  { id: "15", name: "SSD", category: "Electronics", price: 179, stock: 75 },
  {
    id: "16",
    name: "Motherboard",
    category: "Electronics",
    price: 249,
    stock: 25,
  },
  {
    id: "17",
    name: "Power Supply",
    category: "Electronics",
    price: 89,
    stock: 40,
  },
  {
    id: "18",
    name: "CPU Cooler",
    category: "Electronics",
    price: 59,
    stock: 65,
  },
  { id: "19", name: "Case", category: "Electronics", price: 79, stock: 30 },
  {
    id: "20",
    name: "Optical Drive",
    category: "Electronics",
    price: 39,
    stock: 20,
  },
  {
    id: "21",
    name: "Network Card",
    category: "Electronics",
    price: 49,
    stock: 85,
  },
  {
    id: "22",
    name: "Sound Card",
    category: "Electronics",
    price: 69,
    stock: 45,
  },
  { id: "23", name: "TV", category: "Electronics", price: 899, stock: 12 },
  {
    id: "24",
    name: "Projector",
    category: "Electronics",
    price: 599,
    stock: 8,
  },
  {
    id: "25",
    name: "Gaming Chair",
    category: "Furniture",
    price: 299,
    stock: 18,
  },
]

export default function BasicTableStateExample() {
  // Controlled state management for all table state
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })

  const resetAllState = () => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 5 })
  }

  // Calculate product metrics
  const productMetrics = React.useMemo(() => {
    const categories = Array.from(
      new Set(data.map(product => product.category)),
    )
    const totalValue = data.reduce(
      (sum, product) => sum + product.price * product.stock,
      0,
    )
    const averagePrice =
      data.reduce((sum, product) => sum + product.price, 0) / data.length
    const totalStock = data.reduce((sum, product) => sum + product.stock, 0)
    const lowStockItems = data.filter(product => product.stock < 30)
    const highValueItems = data.filter(product => product.price > 500)

    return {
      totalProducts: data.length,
      categories: categories.length,
      totalValue,
      averagePrice,
      totalStock,
      lowStockCount: lowStockItems.length,
      highValueCount: highValueItems.length,
      categoryList: categories,
    }
  }, [])

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
        }}
        onGlobalFilterChange={setGlobalFilter}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onPaginationChange={setPagination}
      >
        <DataTableToolbarSection className="justify-between">
          <h2 className="text-lg font-semibold">Products</h2>
          <DataTableViewMenu />
        </DataTableToolbarSection>
        <DataTable>
          <DataTableHeader />
          <DataTableBody />
        </DataTable>
        <DataTablePagination />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Table State</CardTitle>
          <CardDescription>
            Live view of the basic table state with product inventory data
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
              <span className="font-medium">Total Products:</span>
              <span className="text-foreground">
                {productMetrics.totalProducts}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Categories:</span>
              <span className="text-foreground">
                {productMetrics.categories}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Inventory Value:</span>
              <span className="text-foreground">
                ${productMetrics.totalValue.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Average Price:</span>
              <span className="text-foreground">
                ${productMetrics.averagePrice.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Stock:</span>
              <span className="text-foreground">
                {productMetrics.totalStock.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Low Stock Items:</span>
              <span className="text-foreground">
                {productMetrics.lowStockCount} (&lt;30)
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">High Value Items:</span>
              <span className="text-foreground">
                {productMetrics.highValueCount} (&gt;$500)
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
