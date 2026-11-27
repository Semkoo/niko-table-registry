"use client"

/**
 * Niko Table's button primitive, React Aria build. Same API as the shadcn
 * Radix `Button` (native `<button>` props, `variant`, `size`, `asChild`), styled
 * with the React Aria shadcn `buttonVariants`. A native button (not the React
 * Aria `Button`) keeps `onClick` / `disabled` / `type` / `ref` working at every
 * Niko Table call site, and lets the overlay triggers wrap it in `Pressable`.
 */
import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const classes = cn(buttonVariants({ variant, size }), className)

  if (asChild && React.isValidElement<{ className?: string }>(children)) {
    // Slot: the child element is the button (e.g. a link styled as one).
    return React.cloneElement(children, {
      "data-slot": "button",
      ...props,
      className: cn(classes, children.props.className),
    } as React.HTMLAttributes<HTMLElement>)
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
