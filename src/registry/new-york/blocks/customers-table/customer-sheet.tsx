"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import { Progress } from "@/components/ui/progress"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/niko-table/primitives/sheet"
import { Check, Copy, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Customer } from "./customers-data"
import { formatDate, initials, money, statusDot } from "./customers-format"

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <dl className="divide-y">{children}</dl>
    </section>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-6"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  )
}

/** Side panel with one customer's details. Opens on row click. */
export function CustomerSheet({
  customer,
  onOpenChange,
  onCancelSubscription,
}: {
  customer: Customer | null
  onOpenChange: (open: boolean) => void
  onCancelSubscription: (customer: Customer) => void
}) {
  return (
    <Sheet open={customer !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {customer && (
          <>
            <SheetHeader className="flex-row items-center gap-3 border-b">
              <Avatar className="size-10">
                <AvatarFallback>{initials(customer.name)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <SheetTitle className="truncate">{customer.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2 capitalize">
                  <span
                    className={cn(
                      "size-2 rounded-full",
                      statusDot[customer.status],
                    )}
                    aria-hidden="true"
                  />
                  {customer.status} · {customer.plan} plan
                </SheetDescription>
              </div>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
              <DetailSection title="Subscription">
                <DetailRow label="Plan">
                  <Badge variant="secondary" className="capitalize">
                    {customer.plan}
                  </Badge>
                </DetailRow>
                <DetailRow label="MRR">
                  <span className="tabular-nums">
                    {customer.status === "active"
                      ? `${money.format(customer.mrr)} (${customer.mrrChange >= 0 ? "+" : ""}${customer.mrrChange}%)`
                      : "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Seats">
                  <div className="flex w-36 flex-col items-end gap-1">
                    <span className="tabular-nums">
                      {customer.seatsUsed} of {customer.seatsTotal} used
                    </span>
                    <Progress
                      value={(customer.seatsUsed / customer.seatsTotal) * 100}
                      className="h-1.5"
                      aria-label="Seats used"
                    />
                  </div>
                </DetailRow>
                <DetailRow label="Customer since">
                  {formatDate(customer.signedUp)}
                </DetailRow>
              </DetailSection>

              <DetailSection title="Account">
                <DetailRow label="Customer ID">
                  <span className="flex items-center gap-1 font-mono text-xs">
                    {customer.id}
                    <CopyButton value={customer.id} label="Copy customer ID" />
                  </span>
                </DetailRow>
                <DetailRow label="Email">{customer.email}</DetailRow>
                <DetailRow label="Region">{customer.region}</DetailRow>
              </DetailSection>
            </div>

            <SheetFooter className="flex-row justify-between border-t">
              <Button
                variant="outline"
                size="sm"
                disabled={customer.status === "churned"}
                onClick={() => onCancelSubscription(customer)}
              >
                Cancel subscription
              </Button>
              <Button size="sm" asChild>
                <a href={`mailto:${customer.email}`}>
                  <Mail className="size-4" aria-hidden="true" />
                  Email
                </a>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
