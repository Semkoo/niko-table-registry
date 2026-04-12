"use client"

import React, { useState } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { FILTER_VARIANTS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
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
  brand: string
  price: number
  stock: number
  rating: number
  revenue: number
  releaseDate: Date
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
  {
    accessorKey: "brand",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Brand" />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("brand")}</div>
    ),
  },
  {
    accessorKey: "rating",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Rating" />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center gap-1">
          <span>{rating}</span>
          <span className="text-yellow-500">★</span>
        </div>
      )
    },
  },
  {
    accessorKey: "revenue",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Revenue" />
        <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      const revenue = row.getValue("revenue") as number
      return <div className="font-mono">${revenue.toLocaleString()}</div>
    },
  },
  {
    accessorKey: "releaseDate",
    header: () => (
      <DataTableColumnHeader>
        <DataTableColumnTitle title="Release Date" />
        <DataTableColumnSortMenu />
      </DataTableColumnHeader>
    ),
    cell: ({ row }) => {
      const date = row.getValue("releaseDate") as Date
      return <span>{date.toLocaleDateString()}</span>
    },
  },
]

const data: Product[] = [
  {
    id: "1",
    name: "Laptop",
    category: "Electronics",
    brand: "Apple",
    price: 999,
    stock: 50,
    rating: 1,
    revenue: 49950,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "2",
    name: "Mouse",
    category: "Electronics",
    brand: "Samsung",
    price: 29,
    stock: 150,
    rating: 3,
    revenue: 4350,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "3",
    name: "Keyboard",
    category: "Electronics",
    brand: "Nike",
    price: 79,
    stock: 80,
    rating: 5,
    revenue: 6320,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "4",
    name: "Monitor",
    category: "Electronics",
    brand: "Adidas",
    price: 299,
    stock: 40,
    rating: 2,
    revenue: 11960,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "5",
    name: "Headphones",
    category: "Electronics",
    brand: "Sony",
    price: 149,
    stock: 70,
    rating: 4,
    revenue: 10430,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "6",
    name: "Tablet",
    category: "Electronics",
    brand: "LG",
    price: 599,
    stock: 30,
    rating: 1,
    revenue: 17970,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "7",
    name: "Smartphone",
    category: "Electronics",
    brand: "Dell",
    price: 799,
    stock: 25,
    rating: 3,
    revenue: 19975,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "8",
    name: "Webcam",
    category: "Electronics",
    brand: "HP",
    price: 89,
    stock: 60,
    rating: 5,
    revenue: 5340,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "9",
    name: "Speaker",
    category: "Electronics",
    brand: "Apple",
    price: 199,
    stock: 45,
    rating: 2,
    revenue: 8955,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "10",
    name: "Printer",
    category: "Electronics",
    brand: "Samsung",
    price: 159,
    stock: 20,
    rating: 4,
    revenue: 3180,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "11",
    name: "Router",
    category: "Electronics",
    brand: "Nike",
    price: 119,
    stock: 35,
    rating: 1,
    revenue: 4165,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "12",
    name: "Hard Drive",
    category: "Electronics",
    brand: "Adidas",
    price: 129,
    stock: 55,
    rating: 3,
    revenue: 7095,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "13",
    name: "Graphics Card",
    category: "Electronics",
    brand: "Sony",
    price: 699,
    stock: 15,
    rating: 5,
    revenue: 10485,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "14",
    name: "RAM",
    category: "Electronics",
    brand: "LG",
    price: 99,
    stock: 90,
    rating: 2,
    revenue: 8910,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "15",
    name: "SSD",
    category: "Electronics",
    brand: "Dell",
    price: 179,
    stock: 75,
    rating: 4,
    revenue: 13425,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "16",
    name: "Motherboard",
    category: "Electronics",
    brand: "HP",
    price: 249,
    stock: 25,
    rating: 1,
    revenue: 6225,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "17",
    name: "Power Supply",
    category: "Electronics",
    brand: "Apple",
    price: 89,
    stock: 40,
    rating: 3,
    revenue: 3560,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "18",
    name: "CPU Cooler",
    category: "Electronics",
    brand: "Samsung",
    price: 59,
    stock: 65,
    rating: 5,
    revenue: 3835,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "19",
    name: "Case",
    category: "Electronics",
    brand: "Nike",
    price: 79,
    stock: 30,
    rating: 2,
    revenue: 2370,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "20",
    name: "Optical Drive",
    category: "Electronics",
    brand: "Adidas",
    price: 39,
    stock: 20,
    rating: 4,
    revenue: 780,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "21",
    name: "Network Card",
    category: "Electronics",
    brand: "Sony",
    price: 49,
    stock: 85,
    rating: 1,
    revenue: 4165,
    releaseDate: new Date(2024, 0, 1),
  },
  {
    id: "22",
    name: "Sound Card",
    category: "Electronics",
    brand: "LG",
    price: 69,
    stock: 45,
    rating: 3,
    revenue: 3105,
    releaseDate: new Date(2024, 3, 8),
  },
  {
    id: "23",
    name: "TV",
    category: "Electronics",
    brand: "Dell",
    price: 899,
    stock: 12,
    rating: 5,
    revenue: 10788,
    releaseDate: new Date(2024, 6, 15),
  },
  {
    id: "24",
    name: "Projector",
    category: "Electronics",
    brand: "HP",
    price: 599,
    stock: 8,
    rating: 2,
    revenue: 4792,
    releaseDate: new Date(2024, 9, 22),
  },
  {
    id: "25",
    name: "Gaming Chair",
    category: "Furniture",
    brand: "Apple",
    price: 299,
    stock: 18,
    rating: 4,
    revenue: 5382,
    releaseDate: new Date(2024, 0, 1),
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
