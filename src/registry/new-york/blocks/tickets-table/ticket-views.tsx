"use client"

import { useDataTable } from "@/components/niko-table/core/data-table-context"
import {
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  JOIN_OPERATORS,
} from "@/components/niko-table/lib/constants"
import { Button } from "@/components/niko-table/primitives/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { CURRENT_AGENT, type Ticket } from "./tickets-data"

/** One preset filter per view: column id → values (empty = show everything). */
const views = {
  all: {},
  mine: { assignee: [CURRENT_AGENT] },
  unassigned: { assignee: ["Unassigned"] },
  "at-risk": { slaState: ["breached", "at-risk"] },
  solved: { status: ["solved"] },
} satisfies Record<string, Record<string, string[]>>

type View = keyof typeof views
const labels: Record<View, string> = {
  all: "All",
  mine: "Mine",
  unassigned: "Unassigned",
  "at-risk": "At risk",
  solved: "Solved",
}

/** Same shape the toolbar's faceted filters write, so both stay in sync. */
function toFilters(view: View) {
  return Object.entries(views[view]).map(([id, value]) => ({
    id,
    value: {
      id,
      value,
      variant: FILTER_VARIANTS.MULTI_SELECT,
      operator: FILTER_OPERATORS.IN,
      filterId: `faceted-${id}`,
      joinOperator: JOIN_OPERATORS.AND,
    },
  }))
}

function filterValues(value: unknown): string[] | undefined {
  const inner = (value as { value?: unknown } | undefined)?.value
  return Array.isArray(inner) ? inner.map(String) : undefined
}

/** Quick views: preset filters, highlighted while the filters match one. */
export function TicketViews() {
  const { table } = useDataTable<Ticket>()
  const current = table.state.columnFilters
  const active = (Object.keys(views) as View[]).find(view => {
    const wanted = Object.entries(views[view]) as [string, string[]][]
    return (
      wanted.length === current.length &&
      wanted.every(([id, values]) => {
        const got = filterValues(current.find(f => f.id === id)?.value)
        return (
          got?.length === values.length && values.every(v => got.includes(v))
        )
      })
    )
  })

  // Plain buttons, not ToggleGroup: Radix and Base UI ToggleGroups take
  // different value shapes (string vs string[]).
  return (
    <ButtonGroup aria-label="Ticket views">
      {(Object.keys(views) as View[]).map(view => (
        <Button
          key={view}
          size="sm"
          variant={view === active ? "secondary" : "outline"}
          aria-pressed={view === active}
          onClick={() => {
            table.setColumnFilters(toFilters(view))
            table.setPageIndex(0)
          }}
        >
          {labels[view]}
        </Button>
      ))}
    </ButtonGroup>
  )
}
