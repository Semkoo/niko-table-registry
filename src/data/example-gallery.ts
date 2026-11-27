import type { Demo } from "@/components/markdown/code-preview/_code-preview-internal"

/**
 * Example cards for the galleries, by group. Each gallery page writes a
 * `## Heading` per group (so it shows in "On this page") followed by
 * `<ExampleGallery group="…" />`:
 * - table groups → src/content/docs/examples/index.mdx (/examples/)
 * - grid groups  → src/content/docs/data-grid/examples.mdx (/data-grid/examples/)
 * Card title and description come from each example page's frontmatter;
 * `demo` is the page's main <CodePreview demo>.
 */
export const exampleGallery = {
  "getting-started": [
    { slug: "simple-table", demo: "niko-table/simple" },
    { slug: "basic-table", demo: "niko-table/basic" },
    { slug: "search-table", demo: "niko-table/search" },
  ],
  "rows-and-columns": [
    { slug: "row-selection-table", demo: "niko-table/row-selection" },
    { slug: "row-expansion-table", demo: "niko-table/row-expansion" },
    { slug: "row-context-menu-table", demo: "niko-table/row-context-menu" },
    { slug: "inline-edit-table", demo: "niko-table/inline-edit" },
    { slug: "column-pinning-table", demo: "niko-table/column-pinning" },
    { slug: "grouping-table", demo: "niko-table/grouping" },
    { slug: "column-resize-table", demo: "niko-table/column-resize" },
    { slug: "tree-table", demo: "niko-table/tree-table" },
  ],
  "drag-and-drop": [
    { slug: "row-dnd-table", demo: "niko-table/row-dnd" },
    { slug: "column-dnd-table", demo: "niko-table/column-dnd" },
  ],
  layout: [
    { slug: "aside-table", demo: "niko-table/aside" },
    { slug: "virtualization-table", demo: "niko-table/virtualization-table" },
    { slug: "infinite-scroll-table", demo: "niko-table/infinite-scroll-table" },
    {
      slug: "infinite-scroll-virtualized-table",
      demo: "niko-table/infinite-scroll-virtualized-table",
    },
  ],
  filtering: [
    { slug: "faceted-filter-table", demo: "niko-table/faceted" },
    { slug: "advanced-table", demo: "niko-table/advanced" },
    { slug: "advanced-inline-table", demo: "niko-table/advanced-inline" },
  ],
  "server-side": [
    { slug: "advanced-nuqs-table", demo: "niko-table/advanced-nuqs-state" },
    { slug: "server-side-table", demo: "niko-table/server-side-state" },
    {
      slug: "server-side-nuqs-table",
      demo: "niko-table/server-side-nuqs-state",
    },
    { slug: "drizzle-orm", demo: "niko-table/drizzle-state" },
    { slug: "drizzle-orm-nuqs", demo: "niko-table/drizzle-nuqs-state" },
  ],
  "grid-basics": [
    { slug: "basic-grid", demo: "niko-table/grid-basic" },
    { slug: "composed-grid", demo: "niko-table/grid-all-features" },
    { slug: "cell-types-grid", demo: "niko-table/grid-cell-types" },
  ],
  "grid-editing": [
    { slug: "validation-grid", demo: "niko-table/grid-validation" },
    { slug: "dynamic-columns-grid", demo: "niko-table/grid-dynamic-columns" },
  ],
  "grid-saving": [
    { slug: "persistence-grid", demo: "niko-table/grid-save" },
    { slug: "server-side-grid", demo: "niko-table/grid-server-side-state" },
  ],
} satisfies Record<string, { slug: string; demo: Demo }[]>

export type ExampleGalleryGroup = keyof typeof exampleGallery
