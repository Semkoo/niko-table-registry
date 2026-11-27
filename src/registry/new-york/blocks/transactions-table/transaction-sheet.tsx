"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/niko-table/primitives/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/niko-table/primitives/sheet"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Transaction } from "./transactions-data"
import {
  amountStyle,
  formatClock,
  formatDay,
  formatMoney,
  formatSigned,
} from "./transactions-format"

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
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  )
}

/** Side panel with one transaction's details. Opens on row click. */
export function TransactionSheet({
  transaction,
  onOpenChange,
  onCopyId,
}: {
  transaction: Transaction | null
  onOpenChange: (open: boolean) => void
  onCopyId: (transaction: Transaction) => void
}) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Sheet
      open={transaction !== null}
      onOpenChange={open => {
        if (!open) setCopied(false)
        onOpenChange(open)
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {transaction && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle>{transaction.description}</SheetTitle>
              <SheetDescription>
                {formatDay(transaction.date)} at {formatClock(transaction.date)}{" "}
                UTC
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
              <p
                className={cn(
                  "text-3xl font-semibold tabular-nums",
                  amountStyle(transaction),
                )}
              >
                {formatSigned(transaction.amount)}
              </p>
              <dl className="divide-y">
                <DetailRow label="Transaction ID">
                  <span className="font-mono text-xs">{transaction.id}</span>
                </DetailRow>
                <DetailRow label="Category">
                  <Badge variant="secondary">{transaction.category}</Badge>
                </DetailRow>
                <DetailRow label="Type">
                  <span className="capitalize">{transaction.type}</span>
                </DetailRow>
                <DetailRow label="Status">
                  <span className="capitalize">{transaction.status}</span>
                </DetailRow>
                <DetailRow label="Account">{transaction.account}</DetailRow>
                <DetailRow label="Balance after">
                  <span className="tabular-nums">
                    {formatMoney(transaction.balance)}
                  </span>
                </DetailRow>
              </dl>
              <Button
                variant="outline"
                onClick={() => {
                  onCopyId(transaction)
                  setCopied(true)
                }}
              >
                {copied ? <Check /> : <Copy />}
                Copy transaction ID
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
