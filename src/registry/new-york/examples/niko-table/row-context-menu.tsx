"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableHeader,
  DataTableBody,
} from "@/components/niko-table/core/data-table-structure"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import {
  DataTableRowMenuScope,
  RowMenuItem,
  RowMenuSeparator,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

type Player = {
  id: string
  name: string
  team: string
  status: "Active" | "Injured"
}

const data: Player[] = [
  { id: "1", name: "Alex Morgan", team: "Thunder", status: "Active" },
  { id: "2", name: "Jordan Lee", team: "Phoenix", status: "Injured" },
  { id: "3", name: "Sam Rivera", team: "Dragons", status: "Active" },
  { id: "4", name: "Casey Kim", team: "Wolves", status: "Active" },
]

/**
 * The row actions, defined ONCE. It reads its row from context via
 * `useDataTableRow` and its `RowMenu*` pieces render as a DROPDOWN menu or a
 * CONTEXT menu depending on the surface they're mounted in — so the exact same
 * `<PlayerRowMenu />` powers both the "⋯" kebab and the right-click menu.
 */
function PlayerRowMenu({
  onView,
  onRemove,
}: {
  onView: (player: Player) => void
  onRemove: (player: Player) => void
}) {
  const player = useDataTableRow<Player>()
  return (
    <>
      <RowMenuItem onClick={() => onView(player)}>View profile</RowMenuItem>
      <RowMenuSeparator />
      <RowMenuItem variant="destructive" onClick={() => onRemove(player)}>
        Remove player
      </RowMenuItem>
    </>
  )
}

export default function RowContextMenuExample() {
  const [lastAction, setLastAction] = React.useState(
    "Right-click a row, or use the ⋯ menu.",
  )

  const onView = React.useCallback(
    (player: Player) => setLastAction(`Viewing ${player.name}`),
    [],
  )
  const onRemove = React.useCallback(
    (player: Player) => setLastAction(`Removed ${player.name}`),
    [],
  )

  // Declared once — dropped into BOTH the kebab cell and the body's slot.
  const rowMenu = <PlayerRowMenu onView={onView} onRemove={onRemove} />

  const columns = React.useMemo<DataTableColumnDef<Player>[]>(
    () => [
      {
        accessorKey: "name",
        meta: { label: "Name" },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "team",
        meta: { label: "Team" },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => row.original.team,
      },
      {
        accessorKey: "status",
        meta: { label: "Status" },
        header: () => (
          <DataTableColumnHeader>
            <DataTableColumnTitle />
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => row.original.status,
      },
      {
        id: "actions",
        size: 56,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label={`Open actions for ${row.original.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Same menu as right-click, rendered as a dropdown. */}
                <DataTableRowMenuScope row={row.original} surface="dropdown">
                  {rowMenu}
                </DataTableRowMenuScope>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [rowMenu],
  )

  return (
    <DataTableRoot data={data} columns={columns} getRowId={row => row.id}>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{lastAction}</p>
        <DataTable>
          <DataTableHeader />
          <DataTableBody>
            {/* Same menu as the ⋯ dropdown, rendered on right-click. */}
            <DataTableRowContextMenuSlot>{rowMenu}</DataTableRowContextMenuSlot>
          </DataTableBody>
        </DataTable>
      </div>
    </DataTableRoot>
  )
}
