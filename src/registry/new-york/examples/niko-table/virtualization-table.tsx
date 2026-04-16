"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import {
  FILTER_VARIANTS,
  SYSTEM_COLUMN_IDS,
} from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, UserSearch, SearchX } from "lucide-react"

// Example data type
interface Product {
  id: string
  name: string
  category: string
  brand: string
  price: number
  stock: number
  rating: number
  revenue: number
  status: "in-stock" | "low-stock" | "out-of-stock"
  releaseDate: Date
}

// Generate large dataset for virtualization demo
const generateLargeData = (count: number): Product[] => {
  const categories = [
    "Electronics",
    "Clothing",
    "Food",
    "Books",
    "Sports",
    "Home",
    "Toys",
    "Beauty",
  ]
  const brands = [
    "Apple",
    "Samsung",
    "Nike",
    "Adidas",
    "Sony",
    "LG",
    "Dell",
    "HP",
  ]

  return Array.from({ length: count }, (_, i) => {
    const stock = Math.floor(Math.random() * 150)
    const price = Math.floor(Math.random() * 500) + 10
    return {
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      brand: brands[Math.floor(Math.random() * brands.length)],
      price,
      stock,
      rating: Math.floor(Math.random() * 5) + 1,
      revenue: price * stock,
      status:
        stock === 0 ? "out-of-stock" : stock < 20 ? "low-stock" : "in-stock",
      releaseDate: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      ),
    }
  })
}

const largeData = generateLargeData(10000) // 10,000 items

// Expanded content component for product details
function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="bg-muted/30 p-4">
      <h3 className="font-semibold">Product Details</h3>
      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
        <div>
          <div>
            <span className="text-muted-foreground">ID:</span> {product.id}
          </div>
          <div>
            <span className="text-muted-foreground">Category:</span>{" "}
            {product.category}
          </div>
        </div>
        <div>
          <div>
            <span className="text-muted-foreground">Price:</span> ${""}
            {product.price.toFixed(2)}
          </div>
          <div>
            <span className="text-muted-foreground">Stock:</span>{" "}
            {product.stock}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VirtualizedTableExample() {
  const columns: DataTableColumnDef<Product>[] = React.useMemo(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.EXPAND,
        header: () => null,
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={row.getToggleExpandedHandler()}
              className="h-6 w-6 p-0 hover:bg-accent"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          )
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          expandedContent: (product: Product) => (
            <ProductDetails product={product} />
          ),
        },
      },
      {
        accessorKey: "name",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Name" />
            <DataTableColumnSortMenu />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "category",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Category" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("category")}</div>
        ),
      },
      {
        accessorKey: "price",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Price" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const price = row.getValue("price") as number
          return <div className="font-mono">${price.toFixed(2)}</div>
        },
      },
      {
        accessorKey: "stock",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Stock" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.NUMBER} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.getValue("stock")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle title="Status" />
            <DataTableColumnSortMenu variant={FILTER_VARIANTS.TEXT} />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string
          return (
            <Badge
              variant={
                status === "in-stock"
                  ? "default"
                  : status === "low-stock"
                    ? "secondary"
                    : "destructive"
              }
            >
              {status}
            </Badge>
          )
        },
        filterFn: (row, id, value: string[]) => {
          return value.includes(row.getValue(id))
        },
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
    ],
    [],
  )

  return (
    <DataTableRoot
      data={largeData}
      columns={columns}
      config={{
        enableExpanding: true,
        initialPageSize: 50,
      }}
      getRowCanExpand={row => row.original.stock > 0}
    >
      <DataTableToolbarSection>
        <DataTableSearchFilter placeholder="Search products..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTable height={600} className="rounded-lg border">
        <DataTableVirtualizedHeader />
        <DataTableVirtualizedBody>
          <DataTableVirtualizedEmptyBody>
            <DataTableEmptyMessage>
              <DataTableEmptyIcon>
                <UserSearch className="size-12" />
              </DataTableEmptyIcon>
              <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
              <DataTableEmptyDescription>
                There are no products to display at this time.
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
          </DataTableVirtualizedEmptyBody>
        </DataTableVirtualizedBody>
      </DataTable>
      <DataTablePagination pageSizeOptions={[50, 100, 200, 500]} />
    </DataTableRoot>
  )
}
