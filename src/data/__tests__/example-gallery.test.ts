import { describe, expect, it } from "vitest"
import { exampleGallery } from "../example-gallery"

const pages = Object.keys(import.meta.glob("../../content/docs/examples/*.mdx"))
  .map(path =>
    path
      .split("/")
      .pop()!
      .replace(/\.mdx$/, ""),
  )
  .filter(slug => slug !== "index")
  .sort()

const demos = new Set(
  Object.keys(
    import.meta.glob("../../registry/new-york/examples/niko-table/*.tsx"),
  ).map(
    path =>
      `niko-table/${path
        .split("/")
        .pop()!
        .replace(/\.tsx$/, "")}`,
  ),
)

const galleryPages = Object.values(
  import.meta.glob<string>(
    [
      "../../content/docs/examples/index.mdx",
      "../../content/docs/data-grid/examples.mdx",
    ],
    { query: "?raw", import: "default", eager: true },
  ),
).join("\n")

const items = Object.values(exampleGallery).flat()

describe("example gallery", () => {
  it("lists every example page exactly once", () => {
    expect(items.map(item => item.slug).sort()).toEqual(pages)
  })

  it("points every card at an existing demo", () => {
    expect(items.filter(item => !demos.has(item.demo))).toEqual([])
  })

  it("renders every group exactly once across the gallery pages", () => {
    const used = [...galleryPages.matchAll(/<ExampleGallery group="([^"]+)"/g)]
      .map(match => match[1])
      .sort()
    expect(used).toEqual(Object.keys(exampleGallery).sort())
  })
})
