"use client"

import * as React from "react"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableVirtualizedEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-data-table"
import {
  TableColumnHeader,
  TableColumnTitle,
} from "@/components/niko-data-table/components"
import type { DataTableColumnDef } from "@/components/niko-data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronDown, UserSearch, SearchX } from "lucide-react"

// Example data type
interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: "in-stock" | "low-stock" | "out-of-stock"
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

  return Array.from({ length: count }, (_, i) => {
    const stock = Math.floor(Math.random() * 150)
    return {
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 500) + 10,
      stock,
      status:
        stock === 0 ? "out-of-stock" : stock < 20 ? "low-stock" : "in-stock",
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
        id: "expand",
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
          <TableColumnHeader>
            <TableColumnTitle title="Name" />
          </TableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("name")}</div>
        ),
      },
      {
        accessorKey: "category",
        header: () => (
          <TableColumnHeader>
            <TableColumnTitle title="Category" />
          </TableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("category")}</div>
        ),
      },
      {
        accessorKey: "price",
        header: () => (
          <TableColumnHeader>
            <TableColumnTitle title="Price" />
          </TableColumnHeader>
        ),
        cell: ({ row }) => {
          const price = row.getValue("price") as number
          return <div className="font-mono">${price.toFixed(2)}</div>
        },
      },
      {
        accessorKey: "stock",
        header: () => (
          <TableColumnHeader>
            <TableColumnTitle title="Stock" />
          </TableColumnHeader>
        ),
        cell: ({ row }) => (
          <div className="text-right">{row.getValue("stock")}</div>
        ),
      },
      {
        accessorKey: "status",
        header: () => (
          <TableColumnHeader>
            <TableColumnTitle title="Status" />
          </TableColumnHeader>
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
