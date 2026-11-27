"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { UserPlus } from "lucide-react"
import {
  planOptions,
  regions,
  type Customer,
  type CustomerPlan,
} from "./customers-data"

export type NewCustomer = Pick<
  Customer,
  "name" | "email" | "plan" | "seatsTotal" | "region"
>

/** Form in a side panel. New customers start on a trial. */
export function AddCustomerSheet({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (customer: NewCustomer) => void
}) {
  const [plan, setPlan] = React.useState<CustomerPlan>("starter")
  const [region, setRegion] = React.useState<string>(regions[0])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    onAdd({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      seatsTotal: Math.max(1, Number(form.get("seats")) || 1),
      plan,
      region,
    })
    event.currentTarget.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>Add customer</SheetTitle>
          <SheetDescription>
            They start on a 14-day trial of the plan you pick.
          </SheetDescription>
        </SheetHeader>
        <form
          id="add-customer"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="customer-name">Name</FieldLabel>
              <Input
                id="customer-name"
                name="name"
                required
                autoComplete="off"
                placeholder="Jordan Park"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="customer-email">Work email</FieldLabel>
              <Input
                id="customer-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                placeholder="jordan@example.com"
              />
              <FieldDescription>
                Invoices and trial reminders go here.
              </FieldDescription>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="customer-plan">Plan</FieldLabel>
                <Select
                  value={plan}
                  onValueChange={(value: string | null) =>
                    value && setPlan(value as CustomerPlan)
                  }
                >
                  <SelectTrigger id="customer-plan" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="customer-seats">Seats</FieldLabel>
                <Input
                  id="customer-seats"
                  name="seats"
                  type="number"
                  min={1}
                  defaultValue={5}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="customer-region">Region</FieldLabel>
              <Select
                value={region}
                onValueChange={(value: string | null) =>
                  value && setRegion(value)
                }
              >
                <SelectTrigger id="customer-region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>
        <SheetFooter className="flex-row justify-end border-t">
          <SheetClose asChild>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" form="add-customer" size="sm">
            <UserPlus className="size-4" aria-hidden="true" />
            Add customer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
