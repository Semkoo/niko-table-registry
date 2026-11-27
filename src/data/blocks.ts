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
  {
    name: "tickets-table",
    title: "Support Tickets",
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
    description:
      "A billing screen with invoices grouped by status (count and summed amount per group, switchable off), due-date tracking, KPIs, a due date range filter, and mark paid / remind / copy link / void actions.",
    files: ["invoices-table.tsx", "invoices-format.ts", "invoices-data.ts"],
  },
] as const

export type BlockName = (typeof blocks)[number]["name"]
