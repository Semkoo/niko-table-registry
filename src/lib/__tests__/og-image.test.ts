import { describe, expect, it } from "vitest"
import { ogImagePath, ogSection } from "@/lib/og-image"

describe("og-image", () => {
  it("gives each page its own image and keeps the site image for home", () => {
    expect(ogImagePath("/")).toBe("/og.webp")
    expect(ogImagePath("/404/")).toBe("/og.webp")
    expect(ogImagePath("/examples/basic-table/")).toBe(
      "/og/examples/basic-table.webp",
    )
    expect(ogImagePath("/blocks/orders-table")).toBe(
      "/og/blocks/orders-table.webp",
    )
  })

  it("names the section", () => {
    expect(ogSection("data-grid/introduction")).toBe("Niko Grid")
    expect(ogSection("blocks/orders-table")).toBe("Blocks")
    expect(ogSection("changelog")).toBe("Niko Table")
  })
})
