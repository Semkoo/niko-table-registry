"use client"

import * as React from "react"
import { DataTableRoot } from "@/components/niko-table/core/data-table-root"
import { DataTable } from "@/components/niko-table/core/data-table"
import {
  DataTableBody,
  DataTableEmptyBody,
  DataTableHeader,
} from "@/components/niko-table/core/data-table-structure"
import { useDataTable } from "@/components/niko-table/core/data-table-context"
import { DataTableColumnHeader } from "@/components/niko-table/components/data-table-column-header"
import { DataTableColumnTitle } from "@/components/niko-table/components/data-table-column-title"
import { DataTableColumnSortMenu } from "@/components/niko-table/components/data-table-column-sort"
import { DataTableToolbarSection } from "@/components/niko-table/components/data-table-toolbar-section"
import { DataTableSearchFilter } from "@/components/niko-table/components/data-table-search-filter"
import { DataTableFacetedFilter } from "@/components/niko-table/components/data-table-faceted-filter"
import { DataTableClearFilter } from "@/components/niko-table/components/data-table-clear-filter"
import { DataTableViewMenu } from "@/components/niko-table/components/data-table-view-menu"
import { DataTableSelectionBar } from "@/components/niko-table/components/data-table-selection-bar"
import { DataTablePagination } from "@/components/niko-table/components/data-table-pagination"
import {
  DataTableEmptyDescription,
  DataTableEmptyFilteredMessage,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
} from "@/components/niko-table/components/data-table-empty-state"
import {
  DataTableRowMenuScope,
  RowMenuItem,
  RowMenuSeparator,
  RowMenuSub,
  RowMenuSubContent,
  RowMenuSubTrigger,
  useDataTableRow,
} from "@/components/niko-table/components/data-table-row-menu"
import { DataTableRowContextMenuSlot } from "@/components/niko-table/components/data-table-row-context-menu-slot"
import { SYSTEM_COLUMN_IDS } from "@/components/niko-table/lib/constants"
import type { DataTableColumnDef } from "@/components/niko-table/types"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import { Checkbox } from "@/components/niko-table/primitives/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/niko-table/primitives/dropdown-menu"
import {
  MoreHorizontal,
  SearchX,
  ShieldCheck,
  ShieldOff,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  assignableRoles,
  members as sampleMembers,
  NOW,
  roleOptions,
  statusOptions,
  type Member,
  type MemberRole,
  type MemberStatus,
} from "./team-data"
import {
  formatJoined,
  formatLastActive,
  initials,
  statusDot,
} from "./team-format"
import { InviteMemberDialog, type NewMember } from "./invite-member-dialog"

const roleRank: Record<MemberRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
}

type Actions = {
  setRole: (member: Member, role: MemberRole) => void
  resendInvite: (member: Member) => void
  setStatus: (member: Member, status: MemberStatus) => void
  remove: (members: Member[]) => void
}

/*
 * Row actions: one small piece per action, each reading its row from context.
 * `TeamTable` composes them into ONE fragment that both the "⋯" dropdown and
 * the right-click menu render. The owner is never changed or removed.
 */
function RoleSubmenu({ setRole }: Pick<Actions, "setRole">) {
  const member = useDataTableRow<Member>()
  return (
    <RowMenuSub>
      <RowMenuSubTrigger disabled={member.role === "owner"}>
        Role
      </RowMenuSubTrigger>
      <RowMenuSubContent>
        {assignableRoles.map(option => (
          <RowMenuItem
            key={option.value}
            disabled={option.value === member.role}
            onClick={() => setRole(member, option.value as MemberRole)}
          >
            {option.label}
          </RowMenuItem>
        ))}
      </RowMenuSubContent>
    </RowMenuSub>
  )
}

function ResendInviteItem({ resendInvite }: Pick<Actions, "resendInvite">) {
  const member = useDataTableRow<Member>()
  return (
    <RowMenuItem
      disabled={member.status !== "invited"}
      onClick={() => resendInvite(member)}
    >
      Resend invite
    </RowMenuItem>
  )
}

function SuspendItem({ setStatus }: Pick<Actions, "setStatus">) {
  const member = useDataTableRow<Member>()
  const suspended = member.status === "suspended"
  return (
    <RowMenuItem
      disabled={member.role === "owner" || member.status === "invited"}
      onClick={() => setStatus(member, suspended ? "active" : "suspended")}
    >
      {suspended ? "Reactivate" : "Suspend"}
    </RowMenuItem>
  )
}

function RemoveItem({ remove }: Pick<Actions, "remove">) {
  const member = useDataTableRow<Member>()
  return (
    <RowMenuItem
      variant="destructive"
      disabled={member.role === "owner"}
      onClick={() => remove([member])}
    >
      Remove member
    </RowMenuItem>
  )
}

function sortableHeader() {
  return (
    <DataTableColumnHeader>
      <DataTableColumnTitle />
      <DataTableColumnSortMenu />
    </DataTableColumnHeader>
  )
}

function useMemberColumns(rowMenu: React.ReactNode) {
  return React.useMemo<DataTableColumnDef<Member>[]>(
    () => [
      {
        id: SYSTEM_COLUMN_IDS.SELECT,
        size: 40,
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => (
          <Checkbox
            // Plain boolean: Radix and Base UI checkboxes take indeterminate differently.
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all members on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={value => row.toggleSelected(!!value)}
            aria-label={`Select ${row.original.name}`}
          />
        ),
      },
      {
        // Pinned to the start: stays put while the other columns scroll.
        id: "member",
        // Name and email, so search finds either.
        accessorFn: member => `${member.name} ${member.email}`,
        size: 260,
        meta: { label: "Member" },
        enableHiding: false,
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{row.original.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {row.original.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        size: 120,
        meta: { label: "Role", options: roleOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        // Most powerful first, not alphabetical.
        sortingFn: (a: { original: Member }, b: { original: Member }) =>
          roleRank[a.original.role] - roleRank[b.original.role],
        cell: ({ row }) => (
          <Badge
            variant={row.original.role === "owner" ? "default" : "secondary"}
            className="capitalize"
          >
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        size: 140,
        meta: { label: "Status", options: statusOptions },
        header: sortableHeader,
        enableColumnFilter: true,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 capitalize">
            <span
              className={cn(
                "size-2 rounded-full",
                statusDot[row.original.status],
              )}
              aria-hidden="true"
            />
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "teams",
        size: 200,
        meta: { label: "Teams" },
        enableSorting: false,
        header: sortableHeader,
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.teams.map(team => (
              <Badge key={team} variant="outline">
                {team}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "twoFactor",
        size: 90,
        meta: { label: "2FA" },
        header: sortableHeader,
        cell: ({ row }) =>
          row.original.twoFactor ? (
            <span className="flex items-center text-success">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span className="sr-only">Two-factor on</span>
            </span>
          ) : (
            <span className="flex items-center text-muted-foreground">
              <ShieldOff className="size-4" aria-hidden="true" />
              <span className="sr-only">Two-factor off</span>
            </span>
          ),
      },
      {
        accessorKey: "lastActive",
        size: 150,
        meta: { label: "Last active" },
        header: sortableHeader,
        // Pending invites sort as the least recently active.
        cell: ({ row }) => (
          <span
            className={cn(
              "whitespace-nowrap tabular-nums",
              row.original.lastActive === null &&
                "text-muted-foreground italic",
            )}
          >
            {formatLastActive(row.original.lastActive)}
          </span>
        ),
      },
      {
        accessorKey: "joinedAt",
        size: 130,
        meta: { label: "Joined" },
        header: sortableHeader,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {formatJoined(row.original.joinedAt)}
          </span>
        ),
      },
      {
        // Pinned to the end: the menu is always reachable.
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
}

function TeamHeader({ onInvite }: { onInvite: (member: NewMember) => void }) {
  const { table } = useDataTable<Member>()
  const rows = table.getCoreRowModel().rows.map(row => row.original)
  const pending = rows.filter(member => member.status === "invited").length
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Members</h2>
        <p className="text-sm text-muted-foreground">
          {rows.length - pending}{" "}
          {rows.length - pending === 1 ? "member" : "members"} ·{" "}
          <span className={cn(pending > 0 && "text-warning")}>
            {pending} pending {pending === 1 ? "invite" : "invites"}
          </span>
        </p>
      </div>
      <InviteMemberDialog onInvite={onInvite} />
    </div>
  )
}

function TeamSelectionBar({ remove }: Pick<Actions, "remove">) {
  const { table } = useDataTable<Member>()
  const selected = table
    .getFilteredSelectedRowModel()
    .rows.map(row => row.original)
  // The owner is skipped.
  const removable = selected.filter(m => m.role !== "owner")
  return (
    <DataTableSelectionBar
      selectedCount={selected.length}
      onClear={() => table.resetRowSelection()}
    >
      <Button
        size="sm"
        variant="outline"
        disabled={removable.length === 0}
        onClick={() => {
          remove(removable)
          table.resetRowSelection()
        }}
      >
        Remove selected
      </Button>
    </DataTableSelectionBar>
  )
}

// Counter instead of crypto.randomUUID, which is missing on non-secure origins.
let nextId = 0

export default function TeamTable() {
  const [members, setMembers] = React.useState(sampleMembers)
  const [lastAction, setLastAction] = React.useState("")

  const update = React.useCallback(
    (ids: string[], change: (member: Member) => Member) =>
      setMembers(rows =>
        rows.map(row => (ids.includes(row.id) ? change(row) : row)),
      ),
    [],
  )

  const actions = React.useMemo<Actions>(
    () => ({
      setRole: (member, role) => {
        update([member.id], m => ({ ...m, role }))
        setLastAction(`${member.name} is now ${role}`)
      },
      resendInvite: member => {
        update([member.id], m => ({ ...m, joinedAt: NOW }))
        setLastAction(`Invite resent to ${member.name}`)
      },
      setStatus: (member, status) => {
        update([member.id], m => ({ ...m, status }))
        setLastAction(
          `${member.name} ${status === "active" ? "reactivated" : "suspended"}`,
        )
      },
      remove: removed => {
        const ids = removed.filter(m => m.role !== "owner").map(m => m.id)
        setMembers(rows => rows.filter(row => !ids.includes(row.id)))
        setLastAction(
          `Removed ${removed.length === 1 ? removed[0]?.name : `${removed.length} members`}`,
        )
      },
    }),
    [update],
  )

  const invite = React.useCallback((member: NewMember) => {
    setMembers(rows => [
      {
        ...member,
        id: `mem-new-${++nextId}`,
        status: "invited",
        teams: [],
        lastActive: null,
        twoFactor: false,
        joinedAt: NOW,
      },
      ...rows,
    ])
    setLastAction(`Invite sent to ${member.email}`)
  }, [])

  // The row actions, composed ONCE and mounted in both the "⋯" dropdown and
  // the right-click menu.
  const rowMenu = React.useMemo(
    () => (
      <>
        <RoleSubmenu setRole={actions.setRole} />
        <ResendInviteItem resendInvite={actions.resendInvite} />
        <SuspendItem setStatus={actions.setStatus} />
        <RowMenuSeparator />
        <RemoveItem remove={actions.remove} />
      </>
    ),
    [actions],
  )
  const columns = useMemberColumns(rowMenu)

  return (
    <div className="w-full rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <DataTableRoot
        data={members}
        columns={columns}
        getRowId={member => member.id}
        initialState={{
          columnPinning: { start: ["member"], end: ["actions"] },
        }}
      >
        <div className="flex flex-col gap-4">
          <TeamHeader onInvite={invite} />
          <DataTableToolbarSection className="flex-wrap px-0">
            <DataTableSearchFilter
              placeholder="Search members..."
              className="min-w-48 flex-none sm:w-64"
            />
            <DataTableFacetedFilter accessorKey="role" multiple />
            <DataTableFacetedFilter accessorKey="status" multiple />
            <DataTableClearFilter />
            <div className="ml-auto">
              <DataTableViewMenu />
            </div>
          </DataTableToolbarSection>
          <TeamSelectionBar remove={actions.remove} />
          <DataTable>
            <DataTableHeader />
            <DataTableBody>
              <DataTableRowContextMenuSlot>
                {rowMenu}
              </DataTableRowContextMenuSlot>
              <DataTableEmptyBody>
                <DataTableEmptyMessage>
                  <DataTableEmptyIcon>
                    <Users className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No members</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Invite your team to get started.
                  </DataTableEmptyDescription>
                </DataTableEmptyMessage>
                <DataTableEmptyFilteredMessage>
                  <DataTableEmptyIcon>
                    <SearchX className="size-12" />
                  </DataTableEmptyIcon>
                  <DataTableEmptyTitle>No matching members</DataTableEmptyTitle>
                  <DataTableEmptyDescription>
                    Try a different search or clear the filters.
                  </DataTableEmptyDescription>
                </DataTableEmptyFilteredMessage>
              </DataTableEmptyBody>
            </DataTableBody>
          </DataTable>
          <DataTablePagination />
          {lastAction && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {lastAction}
            </p>
          )}
        </div>
      </DataTableRoot>
    </div>
  )
}
