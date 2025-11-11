"use client"

import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableFacetedFilter,
  DataTableClearFilter,
  DataTableSliderFilter,
  DataTableDateFilter,
  DataTableEmptyBody,
} from "@/components/data-table"
import { TableColumnHeader } from "@/components/data-table/components"
import { daysAgo } from "@/components/data-table/lib"
import type { DataTableColumnDef } from "@/components/data-table/types"
import { Badge } from "@/components/ui/badge"

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

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Product Name",
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Category",
      // Provide static options and augment with dynamic counts
      options: categoryOptions,
      mergeStrategy: "augment",
      dynamicCounts: true,
      showCounts: true,
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      const option = categoryOptions.find(opt => opt.value === category)
      return <span>{option?.label || category}</span>
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true
      const rowValue = String(row.getValue(id))
      return filterValue.includes(rowValue)
    },
  },
  {
    accessorKey: "brand",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Brand",
      // Auto-generate options (no static list) with counts
      autoOptions: true,
      dynamicCounts: true,
      showCounts: true,
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true
      const rowValue = String(row.getValue(id))
      return filterValue.includes(rowValue)
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Price",
      unit: "$",
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      return <div className="font-medium">${price.toFixed(2)}</div>
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: [number, number]) => {
      if (!filterValue) return true
      const value = row.getValue(id) as number
      return value >= filterValue[0] && value <= filterValue[1]
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Stock",
    },
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      return (
        <div className={stock < 10 ? "font-medium text-red-600" : ""}>
          {stock}
        </div>
      )
    },
  },
  {
    accessorKey: "rating",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Rating",
      autoOptions: true,
      dynamicCounts: true,
    },
    cell: ({ row }) => {
      const rating = row.getValue("rating") as number
      return (
        <div className="flex items-center gap-1">
          <span>{rating}</span>
          <span className="text-yellow-500">★</span>
        </div>
      )
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true
      const rowValue = String(row.getValue(id))
      return filterValue.includes(rowValue)
    },
  },
  {
    accessorKey: "inStock",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "In Stock",
      options: [
        { label: "In Stock", value: "true" },
        { label: "Out of Stock", value: "false" },
      ],
      mergeStrategy: "preserve", // keep static labels, no counts needed here
    },
    cell: ({ row }) => {
      const inStock = row.getValue("inStock") as boolean
      return (
        <Badge variant={inStock ? "default" : "secondary"}>
          {inStock ? "Yes" : "No"}
        </Badge>
      )
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: string[]) => {
      if (!filterValue?.length) return true
      const rowValue = row.getValue(id) ? "true" : "false"
      return filterValue.includes(rowValue)
    },
  },
  {
    accessorKey: "releaseDate",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Release Date",
    },
    cell: ({ row }) => {
      const date = row.getValue("releaseDate") as Date
      return <span>{date.toLocaleDateString()}</span>
    },
    enableColumnFilter: true,
    filterFn: (row, id, filterValue: number | [number, number]) => {
      if (!filterValue) return true
      const rowValue = (row.getValue(id) as Date).getTime()

      if (Array.isArray(filterValue)) {
        const [from, to] = filterValue
        if (from && to) {
          return rowValue >= from && rowValue <= to
        }
        if (from) return rowValue >= from
        if (to) return rowValue <= to
        return true
      }

      return rowValue === filterValue
    },
  },
]

const data: Product[] = [
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

function FilterToolbar() {
  return (
    <DataTableToolbarSection className="w-full flex-col justify-between gap-2">
      <DataTableToolbarSection className="px-0">
        <DataTableSearchFilter placeholder="Search products..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTableToolbarSection className="px-0">
        {/* Category: static list + live counts (augment) */}
        <DataTableFacetedFilter accessorKey="category" multiple />
        {/* Brand: fully generated options */}
        <DataTableFacetedFilter accessorKey="brand" />
        {/* Rating: auto-generated (numbers become categorical) */}
        <DataTableFacetedFilter accessorKey="rating" />
        {/* In Stock: preserve static options (no counts) */}
        <DataTableFacetedFilter accessorKey="inStock" />
        <DataTableSliderFilter accessorKey="price" />
        <DataTableDateFilter accessorKey="releaseDate" multiple />
        <DataTableClearFilter />
      </DataTableToolbarSection>
    </DataTableToolbarSection>
  )
}

export default function FacetedTableExample() {
  return (
    <DataTableRoot data={data} columns={columns}>
      <FilterToolbar />
      <DataTable>
        <DataTableHeader />
        <DataTableBody>
          <DataTableEmptyBody />
        </DataTableBody>
      </DataTable>
      <DataTablePagination />
    </DataTableRoot>
  )
}
