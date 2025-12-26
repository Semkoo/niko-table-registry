"use client"

/**
 * All Features Table Example
 *
 * This example demonstrates ALL available features of the DataTable:
 * - Multi-column sorting
 * - Advanced filtering (global search + column filters with AND/OR logic)
 * - Pagination
 * - Row selection with bulk actions
 * - Column visibility
 * - Row expansion
 * - Sidebar panels (left for filters, right for details)
 * - Data export (CSV)
 * - Controlled state management
 * - Selection bar with bulk actions
 */

import { useState, useCallback, useMemo } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  ExpandedState,
} from "@tanstack/react-table"
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableSortMenu,
  DataTableFilterMenu,
  DataTableFacetedFilter,
  DataTableClearFilter,
  DataTableEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyActions,
} from "@/components/niko-data-table"
import {
  TableColumnHeader,
  DataTableAside,
  DataTableAsideContent,
  DataTableAsideHeader,
  DataTableAsideTitle,
  DataTableAsideDescription,
  DataTableAsideClose,
  DataTableSelectionBar,
} from "@/components/niko-data-table/components"
import { useDataTable } from "@/components/niko-data-table/core"
import { daysAgo } from "@/components/niko-data-table/lib"
import { exportTableToCSV } from "@/components/niko-data-table/filters"
import type {
  DataTableColumnDef,
  ExtendedColumnFilter,
} from "@/components/niko-data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { SearchX, UserSearch } from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Product = {
  id: string
  name: string
  category: string
  brand: string
  price: number
  stock: number
  rating: number
  inStock: boolean
  releaseDate: Date
  description: string
  tags: string[]
}

const categoryOptions = [
  { label: "Electronics", value: "electronics" },
  { label: "Clothing", value: "clothing" },
  { label: "Home & Garden", value: "home-garden" },
  { label: "Sports", value: "sports" },
  { label: "Books", value: "books" },
]

const brandOptions = [
  { label: "Apple", value: "apple" },
  { label: "Samsung", value: "samsung" },
  { label: "Nike", value: "nike" },
  { label: "Adidas", value: "adidas" },
  { label: "Sony", value: "sony" },
  { label: "LG", value: "lg" },
  { label: "Dell", value: "dell" },
  { label: "HP", value: "hp" },
]

const initialData: Product[] = [
  {
    id: "1",
    name: "iPhone 15 Pro",
    category: "electronics",
    brand: "apple",
    price: 999,
    stock: 45,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(5),
    description: "Latest iPhone with A17 Pro chip and titanium design",
    tags: ["premium", "new", "smartphone"],
  },
  {
    id: "2",
    name: "Galaxy S24 Ultra",
    category: "electronics",
    brand: "samsung",
    price: 1199,
    stock: 32,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(10),
    description: "Flagship Android phone with S Pen and AI features",
    tags: ["premium", "new", "smartphone"],
  },
  {
    id: "3",
    name: "Air Jordan 1",
    category: "sports",
    brand: "nike",
    price: 170,
    stock: 8,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(25),
    description: "Classic basketball sneakers with iconic design",
    tags: ["sneakers", "basketball", "classic"],
  },
  {
    id: "4",
    name: "Ultraboost 23",
    category: "sports",
    brand: "adidas",
    price: 190,
    stock: 15,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(50),
    description: "Running shoes with Boost technology",
    tags: ["running", "comfort", "athletic"],
  },
  {
    id: "5",
    name: "PlayStation 5",
    category: "electronics",
    brand: "sony",
    price: 499,
    stock: 0,
    rating: 5,
    inStock: false,
    releaseDate: daysAgo(365),
    description: "Next-gen gaming console with ray tracing",
    tags: ["gaming", "console", "entertainment"],
  },
  {
    id: "6",
    name: "OLED C3 TV",
    category: "electronics",
    brand: "lg",
    price: 1499,
    stock: 12,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(90),
    description: "55-inch OLED TV with perfect blacks",
    tags: ["tv", "entertainment", "premium"],
  },
  {
    id: "7",
    name: "XPS 15 Laptop",
    category: "electronics",
    brand: "dell",
    price: 1899,
    stock: 20,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(120),
    description: "Premium laptop for professionals",
    tags: ["laptop", "professional", "premium"],
  },
  {
    id: "8",
    name: "Spectre x360",
    category: "electronics",
    brand: "hp",
    price: 1599,
    stock: 18,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(15),
    description: "2-in-1 convertible laptop",
    tags: ["laptop", "convertible", "versatile"],
  },
  {
    id: "9",
    name: "MacBook Pro 16",
    category: "electronics",
    brand: "apple",
    price: 2499,
    stock: 25,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(30),
    description: "Powerful laptop for creative professionals",
    tags: ["laptop", "professional", "creative"],
  },
  {
    id: "10",
    name: "Galaxy Book3",
    category: "electronics",
    brand: "samsung",
    price: 1399,
    stock: 14,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(180),
    description: "Sleek Windows laptop",
    tags: ["laptop", "windows", "sleek"],
  },
  {
    id: "11",
    name: "Running Shorts",
    category: "clothing",
    brand: "nike",
    price: 45,
    stock: 120,
    rating: 3,
    inStock: true,
    releaseDate: daysAgo(60),
    description: "Comfortable running shorts",
    tags: ["clothing", "running", "athletic"],
  },
  {
    id: "12",
    name: "Training Jacket",
    category: "clothing",
    brand: "adidas",
    price: 85,
    stock: 65,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(45),
    description: "Lightweight training jacket",
    tags: ["clothing", "training", "athletic"],
  },
  {
    id: "13",
    name: "Garden Tools Set",
    category: "home-garden",
    brand: "hp",
    price: 120,
    stock: 30,
    rating: 4,
    inStock: true,
    releaseDate: daysAgo(75),
    description: "Complete set of gardening tools",
    tags: ["tools", "garden", "home"],
  },
  {
    id: "14",
    name: "Programming Book",
    category: "books",
    brand: "dell",
    price: 60,
    stock: 50,
    rating: 5,
    inStock: true,
    releaseDate: daysAgo(200),
    description: "Learn React and TypeScript",
    tags: ["book", "programming", "education"],
  },
  {
    id: "15",
    name: "Wireless Mouse",
    category: "electronics",
    brand: "lg",
    price: 35,
    stock: 200,
    rating: 3,
    inStock: true,
    releaseDate: daysAgo(150),
    description: "Ergonomic wireless mouse",
    tags: ["accessories", "computer", "wireless"],
  },
]

// Expanded row content component
function ExpandedRowContent({ product }: { product: Product }) {
  return (
    <div className="bg-muted/30 p-4">
      <div className="space-y-3">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Description</h4>
          <p className="text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Tags</h4>
          <div className="flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Product details component for sidebar
function ProductDetails({ product }: { product: Product }) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {categoryOptions.find(opt => opt.value === product.category)?.label}
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Brand:</span>
                <span>
                  {brandOptions.find(opt => opt.value === product.brand)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-medium">${product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock:</span>
                <span
                  className={
                    product.stock < 10 ? "font-medium text-red-600" : ""
                  }
                >
                  {product.stock} units
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating:</span>
                <div className="flex items-center gap-1">
                  <span>{product.rating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={product.inStock ? "default" : "secondary"}>
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Release Date:</span>
                <span>{product.releaseDate.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

// Bulk actions component
function BulkActions() {
  const { table } = useDataTable<Product>()
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedCount = selectedRows.length

  const handleBulkExport = () => {
    exportTableToCSV(table, {
      filename: "selected-products",
      excludeColumns: [
        "select",
        "expand",
        "actions",
      ] as unknown as (keyof Product)[],
      onlySelected: true,
    })
  }

  const handleBulkDelete = () => {
    // In a real app, you would delete the selected items
    console.log(
      "Deleting:",
      selectedRows.map(row => row.original.id),
    )
    table.resetRowSelection()
  }

  return (
    <DataTableSelectionBar
      selectedCount={selectedCount}
      onClear={() => table.resetRowSelection()}
    >
      <Button size="sm" variant="outline" onClick={handleBulkExport}>
        <Download className="mr-2 h-4 w-4" />
        Export Selected
      </Button>
      <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Selected
      </Button>
    </DataTableSelectionBar>
  )
}

// Filter toolbar component
function FilterToolbar({
  filters,
  onFiltersChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[] | null) => void
}) {
  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2">
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search products..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="flex-wrap px-0">
        <DataTableFacetedFilter
          accessorKey="category"
          title="Category"
          options={categoryOptions}
          multiple
        />
        <DataTableFacetedFilter
          accessorKey="brand"
          title="Brand"
          options={brandOptions}
          multiple
        />
        <DataTableSortMenu />
        <DataTableFilterMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
        <DataTableClearFilter />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

export default function AllFeaturesTableExample() {
  // Controlled state management
  const [data] = useState<Product[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Sidebar state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  )

  const selectedProduct = selectedProductId
    ? data.find(product => product.id === selectedProductId)
    : null

  const resetAllState = useCallback(() => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setRowSelection({})
    setExpanded({})
    setPagination({ pageIndex: 0, pageSize: 10 })
    setSelectedProductId(null)
  }, [])

  // Extract filters for display
  const currentFilters = useMemo(() => {
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: ExtendedColumnFilter<Product>[]
      }
      return filterObj.filters || []
    }
    return columnFilters
      .map(cf => cf.value)
      .filter(
        (v): v is ExtendedColumnFilter<Product> =>
          v !== null && typeof v === "object" && "id" in v,
      )
  }, [globalFilter, columnFilters])

  // Handler for filter menu
  const handleFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      if (!filters || filters.length === 0) {
        setColumnFilters([])
        setGlobalFilter("")
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        const hasOrFilters = filters.some(
          (filter, index) => index > 0 && filter.joinOperator === "or",
        )
        if (hasOrFilters) {
          setColumnFilters([])
          setGlobalFilter({
            filters,
            joinOperator: "mixed",
          })
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        } else {
          setGlobalFilter("")
          setColumnFilters(
            filters.map(filter => ({
              id: filter.id,
              value: filter,
            })),
          )
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }
      }
    },
    [],
  )

  // Define columns with all features
  const columns: DataTableColumnDef<Product>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) => {
          if (!row.getCanExpand()) return null
          return (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={row.getToggleExpandedHandler()}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )
        },
        size: 50,
        enableSorting: false,
        enableHiding: false,
        meta: {
          expandedContent: (product: Product) => (
            <ExpandedRowContent product={product} />
          ),
        },
      },
      {
        accessorKey: "name",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Product Name",
          variant: "text",
        },
        enableColumnFilter: true,
        cell: ({ row }) => (
          <div
            className="cursor-pointer font-medium hover:underline"
            onClick={() => {
              setSelectedProductId(row.original.id)
            }}
          >
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Category",
          variant: "select",
          options: categoryOptions,
        },
        cell: ({ row }) => {
          const category = row.getValue("category") as string
          const option = categoryOptions.find(opt => opt.value === category)
          return <span>{option?.label || category}</span>
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "brand",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Brand",
          variant: "select",
          options: brandOptions,
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "price",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Price",
          unit: "$",
          variant: "number",
        },
        cell: ({ row }) => {
          const price = parseFloat(row.getValue("price"))
          return <div className="font-medium">${price.toFixed(2)}</div>
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "stock",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Stock",
          variant: "number",
        },
        cell: ({ row }) => {
          const stock = Number(row.getValue("stock"))
          return (
            <div className={stock < 10 ? "font-medium text-red-600" : ""}>
              {stock}
            </div>
          )
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "rating",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Rating",
          variant: "number",
        },
        cell: ({ row }) => {
          const rating = Number(row.getValue("rating"))
          return (
            <div className="flex items-center gap-1">
              <span>{rating}</span>
              <span className="text-yellow-500">★</span>
            </div>
          )
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "inStock",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "In Stock",
          variant: "boolean",
        },
        cell: ({ row }) => {
          const inStock = Boolean(row.getValue("inStock"))
          return (
            <Badge variant={inStock ? "default" : "secondary"}>
              {inStock ? "Yes" : "No"}
            </Badge>
          )
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "releaseDate",
        header: ({ column }) => <TableColumnHeader column={column} />,
        meta: {
          label: "Release Date",
          variant: "date",
        },
        cell: ({ row }) => {
          const date = row.getValue("releaseDate") as Date
          return <span>{date.toLocaleDateString()}</span>
        },
        enableColumnFilter: true,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const product = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedProductId(product.id)
                    }}
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log("Edit", product.id)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log("Delete", product.id)}
                    className="text-red-600"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  )

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        config={{
          enablePagination: true,
          enableSorting: true,
          enableMultiSort: true,
          enableFilters: true,
          enableRowSelection: true,
          enableExpanding: true,
        }}
        getRowCanExpand={() => true}
        getSubRows={() => undefined}
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          rowSelection,
          expanded,
          pagination,
        }}
        onGlobalFilterChange={value => {
          setGlobalFilter(value)
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        }}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onColumnVisibilityChange={setColumnVisibility}
        onRowSelectionChange={setRowSelection}
        onExpandedChange={setExpanded}
        onPaginationChange={setPagination}
      >
        <FilterToolbar
          filters={currentFilters}
          onFiltersChange={handleFiltersChange}
        />
        <BulkActions />

        {/* Sidebar Layout */}
        <div className="flex min-h-[600px] gap-4">
          {/* Main Table Area */}
          <DataTable className="flex-1" height="100%">
            <DataTableHeader />
            <DataTableBody
              onRowClick={(product: Product) => {
                console.log("Row clicked:", product.id)
                setSelectedProductId(product.id)
              }}
            >
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <UserSearch className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Get started by adding your first product to the inventory.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try adjusting your filters or search to find what
                    you&apos;re looking for.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
                <DataTableEmptyActions>
                  <Button onClick={() => alert("Add product clicked")}>
                    Add Product
                  </Button>
                </DataTableEmptyActions>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>

          {/* Right Sidebar - Product Details */}
          {selectedProduct && (
            <DataTableAside
              side="right"
              open={!!selectedProduct}
              onOpenChange={open => {
                if (!open) setSelectedProductId(null)
              }}
            >
              <DataTableAsideContent width="w-78">
                <DataTableAsideHeader>
                  <DataTableAsideTitle>Product Details</DataTableAsideTitle>
                  <DataTableAsideDescription>
                    View detailed information
                  </DataTableAsideDescription>
                  <DataTableAsideClose />
                </DataTableAsideHeader>
                <ProductDetails product={selectedProduct} />
              </DataTableAsideContent>
            </DataTableAside>
          )}
        </div>
        <DataTablePagination />
      </DataTableRoot>

      {/* State Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Table State</CardTitle>
          <CardDescription>
            Live view of all table state for demonstration
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
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">{data.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Selected Rows:</span>
              <span className="text-foreground">
                {
                  Object.keys(rowSelection).filter(key => rowSelection[key])
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Expanded Rows:</span>
              <span className="text-foreground">
                {typeof expanded === "object" && expanded !== null
                  ? Object.keys(expanded).filter(
                      key => (expanded as Record<string, boolean>)[key],
                    ).length
                  : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">{currentFilters.length}</span>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
