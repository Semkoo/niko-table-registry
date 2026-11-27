import { describe, expect, it } from "vitest"
import { getBreadcrumbs, headingId } from "../breadcrumbs"

const link = (label: string, href: string, isCurrent = false) => ({
  type: "link" as const,
  label,
  href,
  isCurrent,
  badge: undefined,
  attrs: {},
})
const group = (label: string, entries: unknown[]) => ({
  type: "group" as const,
  label,
  entries,
  collapsed: false,
  badge: undefined,
})

function sidebar(current: string) {
  const l = (label: string, href: string) => link(label, href, href === current)
  return [
    group("Getting Started", [
      l("Introduction", "/getting-started/introduction/"),
      l("Installation", "/getting-started/installation/"),
    ]),
    group("Examples", [
      l("Gallery", "/examples/"),
      group("Filtering", [
        l("Faceted Filter", "/examples/faceted-filter-table/"),
        l("Advanced Filter", "/examples/advanced-table/"),
      ]),
    ]),
  ] as Parameters<typeof getBreadcrumbs>[0]
}

const trail = (path: string, title: string) =>
  getBreadcrumbs(sidebar(path), path, title).map(c => `${c.label} ${c.href}`)

describe("getBreadcrumbs", () => {
  it("links every section to its first page", () => {
    expect(trail("/getting-started/installation/", "Installation")).toEqual([
      "Docs /getting-started/introduction/",
      "Getting Started /getting-started/introduction/",
    ])
  })

  it("includes nested groups and uses the gallery for Examples", () => {
    expect(trail("/examples/advanced-table/", "Advanced Filter Table")).toEqual(
      [
        "Docs /getting-started/introduction/",
        "Table Examples /examples/",
        "Filtering /examples/#filtering",
      ],
    )
  })

  it("keeps a nested group even when its first page is this page", () => {
    expect(
      trail("/examples/faceted-filter-table/", "Faceted Filter Table"),
    ).toEqual([
      "Docs /getting-started/introduction/",
      "Table Examples /examples/",
      "Filtering /examples/#filtering",
    ])
  })

  it("matches Starlight heading ids", () => {
    expect(headingId("Row & Column Features")).toBe("row--column-features")
    expect(headingId("Server-Side & URL State")).toBe("server-side--url-state")
  })

  it("drops a section that is the current page", () => {
    expect(trail("/examples/", "Table Examples")).toEqual([
      "Docs /getting-started/introduction/",
    ])
  })

  it("gives block pages a Blocks step", () => {
    expect(trail("/blocks/customers-table/", "Customers Table")).toEqual([
      "Docs /getting-started/introduction/",
      "Blocks /blocks/",
    ])
  })
})
