import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TableFacetedFilterContent } from "../filters/table-faceted-filter"

const options = [
  { label: "Electronics", value: "electronics" },
  { label: "Books", value: "books" },
]

function renderContent(multiple: boolean) {
  return render(
    <TableFacetedFilterContent
      title="Category"
      options={options}
      selectedValues={new Set()}
      onItemSelect={() => {}}
      onReset={() => {}}
      multiple={multiple}
    />,
  )
}

describe("faceted filter multi-select hint", () => {
  it("tells the user they can pick more than one", () => {
    renderContent(true)
    expect(screen.getByText("Select one or more.")).toBeTruthy()
  })

  it("is not shown for single-select", () => {
    renderContent(false)
    expect(screen.queryByText("Select one or more.")).toBeNull()
  })
})
