"use client"

import type { Order } from "./orders-data"
import { channelLabels } from "./orders-data"
import { money } from "./orders-format"

function Row({
  label,
  value,
  strong,
}: {
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="flex justify-between gap-6">
      <dt className={strong ? "font-medium" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd className={strong ? "font-medium tabular-nums" : "tabular-nums"}>
        {value}
      </dd>
    </div>
  )
}

/** Shown when an order row is expanded: what was bought and where it goes. */
export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="grid gap-6 bg-muted/30 px-4 py-4 text-sm md:grid-cols-[1fr_16rem] md:pl-14">
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Items
        </h4>
        <ul className="divide-y rounded-md border bg-background">
          {order.items.map(item => (
            <li
              key={item.sku}
              className="flex items-center justify-between gap-4 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate">{item.product}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {item.sku}
                </span>
              </div>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {item.quantity} × {money.format(item.unitPrice)}
              </span>
              <span className="w-20 shrink-0 text-right font-medium tabular-nums">
                {money.format(item.quantity * item.unitPrice)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4">
        <dl className="flex flex-col gap-1">
          <Row label="Subtotal" value={money.format(order.subtotal)} />
          <Row
            label="Shipping"
            value={order.shipping === 0 ? "Free" : money.format(order.shipping)}
          />
          <Row label="Tax" value={money.format(order.tax)} />
          <div className="my-1 border-t" />
          <Row label="Total" value={money.format(order.total)} strong />
        </dl>
        <dl className="flex flex-col gap-1">
          <Row label="Ships to" value={order.city} />
          <Row label="Channel" value={channelLabels[order.channel]} />
          <Row label="Contact" value={order.email} />
        </dl>
      </div>
    </div>
  )
}
