"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { assignableRoles, type Member, type MemberRole } from "./team-data"

export type NewMember = Pick<Member, "name" | "email" | "role">

/** The "Invite member" button and its form, in one dialog. */
export function InviteMemberDialog({
  onInvite,
}: {
  onInvite: (member: NewMember) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [role, setRole] = React.useState<MemberRole>("member")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onInvite({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      role,
    })
    event.currentTarget.reset()
    setRole("member")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" aria-hidden="true" />
          Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            They get an email with a link to join.
          </DialogDescription>
        </DialogHeader>
        <form id="invite-member" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-name">Name</FieldLabel>
              <Input
                id="invite-name"
                name="name"
                required
                autoComplete="off"
                placeholder="Jordan Park"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-email">Work email</FieldLabel>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="jordan@example.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value: string | null) =>
                  value && setRole(value as MemberRole)
                }
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="invite-member" size="sm">
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
