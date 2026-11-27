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
    category: "Base",
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
    category: "Expansion",
    description:
      "An orders screen with live totals, payment and fulfillment filters, a price slider, a date range, expandable rows with line items, and ship and refund actions.",
    files: [
      "orders-table.tsx",
      "order-details.tsx",
      "orders-format.ts",
      "orders-data.ts",
    ],
  },
  {
    name: "tickets-table",
    title: "Support Tickets",
    category: "Filtering",
    description:
      "A support inbox with quick views (Mine, Unassigned, At risk), SLA timers, priority and assignee filters, a priority submenu, and assign / solve actions in bulk or per ticket.",
    files: [
      "tickets-table.tsx",
      "ticket-views.tsx",
      "tickets-format.ts",
      "tickets-data.ts",
    ],
  },
  {
    name: "team-table",
    title: "Team Members",
    category: "Columns",
    description:
      "A workspace members screen: pinned member and actions columns that stay put while the table scrolls sideways, a Role submenu in the row menu, suspend and remove actions, bulk remove, and an invite dialog.",
    files: [
      "team-table.tsx",
      "invite-member-dialog.tsx",
      "team-format.ts",
      "team-data.ts",
    ],
  },
  {
    name: "request-logs-table",
    title: "API Request Logs",
    category: "Virtualization",
    description:
      "A developer request log with 5,000 virtualized rows, live error rate and p95 latency, method, status class and region filters, a latency slider, and a details panel with a response preview.",
    files: [
      "request-logs-table.tsx",
      "log-sheet.tsx",
      "logs-format.ts",
      "logs-data.ts",
    ],
  },
  {
    name: "invoices-table",
    title: "Invoices",
    category: "Grouping",
    description:
      "A billing screen with invoices grouped by status (count and summed amount per group, switchable off), due-date tracking, KPIs, a due date range filter, and mark paid / remind / copy link / void actions.",
    files: ["invoices-table.tsx", "invoices-format.ts", "invoices-data.ts"],
  },
  {
    name: "backlog-table",
    title: "Sprint Backlog",
    category: "Drag & Drop",
    description:
      "A sprint backlog you prioritize by dragging rows, with a capacity line that moves as you reorder, column order from a drag-and-drop view menu, handles that switch off while filtering, and move to top / bottom, status and remove actions.",
    files: [
      "backlog-table.tsx",
      "backlog-cells.tsx",
      "backlog-format.ts",
      "backlog-data.ts",
    ],
  },
  {
    name: "shipments-table",
    title: "Shipments",
    category: "Columns",
    description:
      "A wide logistics table you shape yourself: drag-resizable columns with saved widths, pin left / right / unpin and hide from each column menu, a Reset layout button, route and late ETA cells, and copy ID / mark delivered / flag exception actions.",
    files: [
      "shipments-table.tsx",
      "shipments-layout.ts",
      "shipments-format.ts",
      "shipments-data.ts",
    ],
  },
  {
    name: "transactions-table",
    title: "Transactions Ledger",
    category: "Virtualization",
    description:
      "A bank-style ledger that loads as you scroll: 20,000 transactions served 100 at a time by a fake server, a virtualized body, server-side search, category and type filters, money in and out totals, and a details panel with a copy ID button.",
    files: [
      "transactions-table.tsx",
      "transaction-sheet.tsx",
      "transactions-format.ts",
      "transactions-data.ts",
    ],
  },
  {
    name: "inventory-grid",
    title: "Inventory Grid",
    category: "Editing",
    description:
      "An editable product inventory on Niko Grid: typed cells, inline validation, low-stock markers, live totals, an unsaved changes bar with Save and Discard, add, duplicate and delete product, undo and redo, and a virtualized body.",
    files: ["inventory-grid.tsx", "inventory-format.ts", "inventory-data.ts"],
  },
] as const

/** Categories in the order the /blocks/ page shows them. */
export const blockCategories = [
  "Base",
  "Filtering",
  "Columns",
  "Expansion",
  "Grouping",
  "Editing",
  "Drag & Drop",
  "Virtualization",
] as const

export type BlockName = (typeof blocks)[number]["name"]
