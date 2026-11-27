/**
 * Blocks: full, ready-to-copy screens built from niko-table pieces.
 * Each one lives in src/registry/new-york/blocks/<name>/<name>.tsx (default
 * export), ships as the `<name>` registry item, and gets a page at
 * /blocks/<name>/ plus a bare full-screen view at /view/<name>/.
 */
export const blocks = [
  {
    name: "customers-table",
    title: "Customers Table",
    description:
      "A complete customers screen: search, status and plan filters, sortable columns, bulk selection, CSV export, a details panel on row click and an add-customer form.",
    files: [
      "customers-table.tsx",
      "customer-sheet.tsx",
      "add-customer-sheet.tsx",
      "customers-format.ts",
      "customers-data.ts",
    ],
  },
] as const

export type BlockName = (typeof blocks)[number]["name"]
