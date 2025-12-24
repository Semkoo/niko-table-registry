"use client"

import { useState, useCallback, useMemo } from "react"
import type {
  PaginationState,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  Updater,
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
  DataTableEmptyBody,
  DataTableEmptyFilteredMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
} from "@/components/data-table"
import { TableColumnHeader } from "@/components/data-table/components"
import {
  daysAgo,
  JOIN_OPERATORS,
  processFiltersForLogic,
} from "@/components/data-table/lib"
import type {
  DataTableColumnDef,
  ExtendedColumnFilter,
} from "@/components/data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UserSearch, SearchX } from "lucide-react"

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

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Product Name",
      variant: "text",
    },
    enableColumnFilter: true,
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
  },
]

function FilterToolbar({
  filters,
  onFiltersChange,
}: {
  filters: ExtendedColumnFilter<Product>[]
  onFiltersChange: (filters: ExtendedColumnFilter<Product>[] | null) => void
}) {
  return (
    <DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search products..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        <DataTableSortMenu className="ml-auto" />
        <DataTableFilterMenu
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

export default function AdvancedStateTableExample() {
  // State management with useState - tracking all table state
  const [data] = useState<Product[]>(initialData)
  const [globalFilter, setGlobalFilter] = useState<string | object>("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const resetAllState = useCallback(() => {
    setGlobalFilter("")
    setSorting([])
    setColumnFilters([])
    setColumnVisibility({})
    setPagination({ pageIndex: 0, pageSize: 10 })
  }, [])

  // Helper to display global filter state
  const getGlobalFilterDisplay = () => {
    if (typeof globalFilter === "string") {
      return globalFilter || "None"
    }
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      return `OR Filter (${filterObj.filters?.length || 0} conditions)`
    }
    return "None"
  }

  // Extract actual filter data for display - handles both columnFilters and OR filters in globalFilter
  const displayFilters = useMemo(() => {
    // For OR logic: filters are stored in globalFilter object
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      return filterObj.filters || []
    }

    // For AND logic: filters should be in columnFilters
    return columnFilters
  }, [columnFilters, globalFilter])

  // Enhanced filter statistics for better insights
  const filterStats = useMemo(() => {
    // For mixed logic stored in globalFilter object
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: Array<{
          joinOperator?: string
          value?: unknown
        }>
        joinOperator: string
      }
      const filters = filterObj.filters || []

      const hasAndFilters = filters.some(
        (filter, index) =>
          index === 0 || filter.joinOperator === JOIN_OPERATORS.AND,
      )
      const hasOrFilters = filters.some(
        (filter, index) =>
          index > 0 && filter.joinOperator === JOIN_OPERATORS.OR,
      )

      return {
        totalFilters: filters.length,
        hasAndFilters,
        hasOrFilters,
        effectiveJoinOperator: hasOrFilters
          ? JOIN_OPERATORS.MIXED
          : JOIN_OPERATORS.AND,
        activeFilters: filters.filter(f => f.value && f.value !== "").length,
      }
    }

    // For regular columnFilters (AND logic)
    const hasAndFilters = columnFilters.length > 0
    const hasOrFilters = columnFilters.some(
      filter =>
        typeof filter.value === "object" &&
        filter.value &&
        "joinOperator" in filter.value &&
        filter.value.joinOperator === "or",
    )

    return {
      totalFilters: columnFilters.length,
      hasAndFilters,
      hasOrFilters,
      effectiveJoinOperator: hasOrFilters
        ? JOIN_OPERATORS.MIXED
        : JOIN_OPERATORS.AND,
      activeFilters: columnFilters.filter(f => f.value && f.value !== "")
        .length,
    }
  }, [columnFilters, globalFilter])

  // Get current filter mode (AND, OR, or MIXED)
  const getFilterMode = () => {
    if (
      typeof globalFilter === "object" &&
      globalFilter &&
      "filters" in globalFilter
    ) {
      const filterObj = globalFilter as {
        filters: unknown[]
        joinOperator: string
      }
      if (filterObj.joinOperator === "mixed") {
        return "MIXED"
      }
      return filterObj.joinOperator.toUpperCase()
    }

    // Check if columnFilters have mixed join operators
    const hasOrOperators = columnFilters.some(
      filter =>
        typeof filter.value === "object" &&
        filter.value &&
        "joinOperator" in filter.value &&
        filter.value.joinOperator === "or",
    )

    return hasOrOperators ? "MIXED" : "AND"
  }

  // Memoized handlers for better performance
  const handleGlobalFilterChange = useCallback((value: string | object) => {
    setGlobalFilter(value)
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [])

  const handleSortingChange = useCallback((updater: Updater<SortingState>) => {
    setSorting(updater)
  }, [])

  const handleColumnFiltersChange = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(updater)
    },
    [],
  )

  const handleColumnVisibilityChange = useCallback(
    (updater: Updater<VisibilityState>) => {
      setColumnVisibility(updater)
    },
    [],
  )

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination(updater)
    },
    [],
  )

  // Extract ExtendedColumnFilter from globalFilter or columnFilters
  const currentFilters = useMemo(() => {
    // Check if filters are in globalFilter (OR/MIXED logic)
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

    // Otherwise extract from columnFilters (AND logic)
    return columnFilters
      .map(cf => cf.value)
      .filter(
        (v): v is ExtendedColumnFilter<Product> =>
          v !== null && typeof v === "object" && "id" in v,
      )
  }, [globalFilter, columnFilters])

  // Handler for filter menu - converts between ExtendedColumnFilter and table state
  // Uses the core utility function for consistent behavior
  const handleFiltersChange = useCallback(
    (filters: ExtendedColumnFilter<Product>[] | null) => {
      if (!filters || filters.length === 0) {
        // Clear all filters
        setColumnFilters([])
        setGlobalFilter("")
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      } else {
        // Use core utility to process filters and determine routing
        const result = processFiltersForLogic(filters)

        if (result.shouldUseGlobalFilter) {
          // Use globalFilter for OR/MIXED logic
          setColumnFilters([])
          setGlobalFilter({
            filters: result.processedFilters,
            joinOperator: result.joinOperator,
          })
          setPagination(prev => ({ ...prev, pageIndex: 0 }))
        } else {
          // Use columnFilters for AND logic
          setGlobalFilter("")
          setColumnFilters(
            result.processedFilters.map(filter => ({
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

  return (
    <div className="w-full space-y-4">
      <DataTableRoot
        data={data}
        columns={columns}
        // Pass state to DataTableRoot for controlled components
        state={{
          globalFilter,
          sorting,
          columnFilters,
          columnVisibility,
          pagination,
        }}
        // Pass state updaters (using useCallback for performance)
        onGlobalFilterChange={handleGlobalFilterChange}
        onSortingChange={handleSortingChange}
        onColumnFiltersChange={handleColumnFiltersChange}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onPaginationChange={handlePaginationChange}
      >
        <FilterToolbar
          filters={currentFilters}
          onFiltersChange={handleFiltersChange}
        />
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            <DataTableEmptyBody>
              <DataTableEmptyMessage>
                <DataTableEmptyIcon>
                  <UserSearch className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No customers found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  There are no customers to display at this time.
                </DataTableEmptyDescription>
              </DataTableEmptyMessage>
              <DataTableEmptyFilteredMessage>
                <DataTableEmptyIcon>
                  <SearchX className="size-12" />
                </DataTableEmptyIcon>
                <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
                <DataTableEmptyDescription>
                  Try adjusting your filters or search to find what you&apos;re
                  looking for.
                </DataTableEmptyDescription>
              </DataTableEmptyFilteredMessage>
            </DataTableEmptyBody>
          </DataTableBody>
        </DataTable>
        <DataTablePagination />
      </DataTableRoot>

      {/* State Display for demonstration */}
      <Card>
        <CardHeader>
          <CardTitle>Current Table State</CardTitle>
          <CardDescription>
            Live view of the current table state for demonstration purposes
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
              <span className="font-medium">Search Query:</span>
              <span className="text-foreground">
                {getGlobalFilterDisplay()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Total Items:</span>
              <span className="text-foreground">{data.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Filters:</span>
              <span className="text-foreground">{columnFilters.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Enhanced Filters:</span>
              <span className="text-foreground">
                {filterStats.totalFilters}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Active Enhanced:</span>
              <span className="text-foreground">
                {filterStats.activeFilters}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="font-medium">Join Logic:</span>
              <span className="text-foreground">
                {filterStats.effectiveJoinOperator}
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
                <strong>Enhanced Filters:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {displayFilters.length > 0
                    ? JSON.stringify(displayFilters, null, 2)
                    : "No enhanced filters"}
                </pre>
              </div>
              <div>
                <strong>Filter Stats:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(filterStats, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Filter Mode:</strong> {getFilterMode()}
                <div className="mt-1 text-muted-foreground">
                  {getFilterMode() === "AND"
                    ? "All conditions must match (stored in columnFilters)"
                    : getFilterMode() === "OR"
                      ? "Any condition can match (stored in globalFilter)"
                      : "Mixed logic - individual AND/OR operators per filter"}
                </div>
              </div>
              <div>
                <strong>Sorting:</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(sorting, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Column Filters State (AND logic):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(columnFilters, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Global Filter State (OR logic):</strong>
                <pre className="mt-1 overflow-auto rounded bg-muted p-2">
                  {JSON.stringify(globalFilter, null, 2)}
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
