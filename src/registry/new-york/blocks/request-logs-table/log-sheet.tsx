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
import type { RequestLog } from "./logs-data"
import {
  formatDateTime,
  methodStyle,
  sampleResponse,
  statusStyle,
} from "./logs-format"

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

/** Side panel with one request's details. Opens on row click. */
export function LogSheet({
  log,
  onOpenChange,
}: {
  log: RequestLog | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={log !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        {log && (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("border-0 font-mono", methodStyle[log.method])}
                >
                  {log.method}
                </Badge>
                <span className="truncate font-mono text-sm">{log.path}</span>
              </SheetTitle>
              <SheetDescription>Request {log.id}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
              <dl className="divide-y">
                <DetailRow label="Request ID">
                  <span className="flex items-center justify-end gap-1 font-mono text-xs">
                    {log.id}
                    <CopyButton value={log.id} label="Copy request ID" />
                  </span>
                </DetailRow>
                <DetailRow label="Status">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      statusStyle(log.status),
                    )}
                  >
                    {log.status}
                  </span>
                </DetailRow>
                <DetailRow label="Latency">
                  <span className="tabular-nums">{log.latencyMs} ms</span>
                </DetailRow>
                <DetailRow label="Region">
                  <span className="font-mono">{log.region}</span>
                </DetailRow>
                <DetailRow label="User agent">
                  <span className="font-mono text-xs">{log.userAgent}</span>
                </DetailRow>
                <DetailRow label="Timestamp">
                  <span className="font-mono text-xs tabular-nums">
                    {formatDateTime(log.timestamp)}
                  </span>
                </DetailRow>
              </dl>

              {log.error && (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {log.error}
                </p>
              )}

              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Response body
                </h3>
                <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs">
                  {JSON.stringify(sampleResponse(log), null, 2)}
                </pre>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
