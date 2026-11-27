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
  {
    name: "orders-table",
    title: "Orders Table",
    description:
      "An orders screen with live totals, payment and fulfillment filters, a price slider, a date range, expandable rows with line items, and ship and refund actions.",
    files: [
      "orders-table.tsx",
      "order-details.tsx",
      "orders-format.ts",
      "orders-data.ts",
    ],
  },
] as const

export type BlockName = (typeof blocks)[number]["name"]
