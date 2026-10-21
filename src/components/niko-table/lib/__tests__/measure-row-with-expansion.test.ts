/**
 * Row measurement for virtualized bodies with expandable rows.
 *
 * The virtualizer only observes the base `<tr>`; an open row's detail pane is
 * its next sibling. If the pane's height is not counted, the virtualizer's
 * offsets drift by that height and the content jumps whenever the pane leaves
 * or re-enters the rendered window. This ran in every browser except Firefox,
 * which is how Firefox got the jump.
 */
import { afterEach, describe, expect, it, vi } from "vitest"

import { measureRowWithExpansion } from "../measure-row-with-expansion"

function stubHeight(element: Element, height: number) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
    height,
  } as DOMRect)
}

function renderRows(expanded: boolean) {
  const tbody = document.createElement("tbody")
  const row = document.createElement("tr")
  tbody.append(row)
  if (expanded) {
    const pane = document.createElement("tr")
    pane.setAttribute("data-slot", "datatable-expanded-row")
    tbody.append(pane)
    return { row, pane }
  }
  tbody.append(document.createElement("tr"))
  return { row, pane: null }
}

function entryWithBlockSize(blockSize: number) {
  return {
    borderBoxSize: [{ blockSize, inlineSize: 0 }],
  } as unknown as ResizeObserverEntry
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("measureRowWithExpansion", () => {
  it("counts the open detail pane with its row", () => {
    const { row, pane } = renderRows(true)
    stubHeight(row, 40)
    stubHeight(pane!, 2000)
    expect(measureRowWithExpansion(row)).toBe(2040)
  })

  it("measures a collapsed row alone, ignoring an ordinary next row", () => {
    const { row } = renderRows(false)
    stubHeight(row, 40)
    expect(measureRowWithExpansion(row)).toBe(40)
  })

  it("takes the base height from the resize observation when given one", () => {
    const { row, pane } = renderRows(true)
    const read = vi.spyOn(row, "getBoundingClientRect")
    stubHeight(pane!, 80)
    expect(measureRowWithExpansion(row, entryWithBlockSize(40))).toBe(120)
    expect(read).not.toHaveBeenCalled()
  })

  it("rounds to whole pixels so sub-pixel heights cannot re-measure forever", () => {
    const { row, pane } = renderRows(true)
    stubHeight(row, 40.4)
    stubHeight(pane!, 79.3)
    expect(measureRowWithExpansion(row)).toBe(120)
  })
})
