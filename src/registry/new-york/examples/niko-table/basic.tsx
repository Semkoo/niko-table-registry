"use client"

import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import { FILTER_VARIANTS } from "@/components/niko-table/lib"
import type { DataTableColumnDef } from "@/components/niko-table/types"

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

export default function BasicTableExample() {
  return (
    <DataTableRoot data={data} columns={columns}>
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
  )
}
