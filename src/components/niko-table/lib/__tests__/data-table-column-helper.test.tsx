/**
 * `createDataTableColumnHelper` is the runtime counterpart of
 * `DataTableColumnDef<TData>`: both pre-bind `DataTableFeatures` so callers
 * never hand-thread the v9 features generic.
 */
import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, expectTypeOf, it } from "vitest"

import { DataTable } from "../../core/data-table"
import { DataTableRoot } from "../../core/data-table-root"
import { DataTableBody, DataTableHeader } from "../../core/data-table-structure"
import type { DataTableColumns } from "../../types"
import { createDataTableColumnHelper } from "../data-table-features"

type Product = {
  id: string
  name: string
  price: number
}

const products: Product[] = [
  { id: "1", name: "Widget", price: 12.5 },
  { id: "2", name: "Gadget", price: 9 },
]

const columnHelper = createDataTableColumnHelper<Product>()

const columns: DataTableColumns<Product> = [
  columnHelper.accessor("name", {
    header: "Name",
    cell: ({ getValue }) => getValue(),
  }),
  columnHelper.accessor("price", {
    header: "Price",
    cell: ({ getValue }) => {
      const price: number = getValue()
      return price.toFixed(2)
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: () => "Edit",
  }),
]

afterEach(cleanup)

describe("createDataTableColumnHelper", () => {
  it("types accessor getValue() from the data field", () => {
    columnHelper.accessor("price", {
      cell: ({ getValue }) => {
        expectTypeOf(getValue()).toEqualTypeOf<number>()
        return getValue()
      },
    })
  })

  it("produces columns assignable to DataTableColumns", () => {
    expectTypeOf(columns).toEqualTypeOf<DataTableColumns<Product>>()
    const asDefs: DataTableColumns<Product> = columns
    expect(asDefs).toHaveLength(3)
  })

  it("renders accessor and display columns through DataTableRoot", async () => {
    await act(async () => {
      render(
        <DataTableRoot data={products} columns={columns}>
          <DataTable>
            <DataTableHeader />
            <DataTableBody />
          </DataTable>
        </DataTableRoot>,
      )
    })

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeTruthy()
    expect(screen.getByRole("columnheader", { name: "Price" })).toBeTruthy()
    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeTruthy()

    expect(screen.getByText("Widget")).toBeTruthy()
    expect(screen.getByText("12.50")).toBeTruthy()
    expect(screen.getAllByText("Edit")).toHaveLength(2)
  })
})
