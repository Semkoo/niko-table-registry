"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableAsideContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: "left" | "right"
}

const DataTableAsideContext = React.createContext<
  DataTableAsideContextValue | undefined
>(undefined)

function useDataTableAside() {
  const context = React.useContext(DataTableAsideContext)
  if (!context) {
    throw new Error(
      "DataTableAside components must be used within DataTableAside",
    )
  }
  return context
}

interface DataTableAsideProps {
  children: React.ReactNode
  side?: "left" | "right"
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

function DataTableAside({
  children,
  side = "right",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
}: DataTableAsideProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  const open = controlledOpen ?? internalOpen
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen

  const contextValue = React.useMemo<DataTableAsideContextValue>(
    () => ({
      open,
      onOpenChange,
      side,
    }),
    [open, onOpenChange, side],
  )

  return (
    <DataTableAsideContext.Provider value={contextValue}>
      {children}
    </DataTableAsideContext.Provider>
  )
}

DataTableAside.displayName = "DataTableAside"

interface DataTableAsideTriggerProps
  extends React.ComponentPropsWithoutRef<"button"> {
  asChild?: boolean
  children?: React.ReactNode
}

function DataTableAsideTrigger({
  className,
  asChild = false,
  children,
  ...props
}: DataTableAsideTriggerProps) {
  const { open, onOpenChange } = useDataTableAside()

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as {
      onClick?: (e: React.MouseEvent) => void
    }
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        onOpenChange(!open)
        childProps.onClick?.(e)
      },
    } as Partial<unknown> & React.Attributes)
  }

  return (
    <button
      data-slot="aside-trigger"
      type="button"
      className={className}
      onClick={() => onOpenChange(!open)}
      {...props}
    >
      {children}
    </button>
  )
}

DataTableAsideTrigger.displayName = "DataTableAsideTrigger"

interface DataTableAsideContentProps
  extends React.ComponentPropsWithoutRef<"aside"> {
  width?: string
  sticky?: boolean
}

function DataTableAsideContent({
  children,
  className,
  width = "w-1/2",
  sticky = false,
  ...props
}: DataTableAsideContentProps) {
  const { open, side } = useDataTableAside()

  if (!open) return null

  const slideAnimation =
    side === "left" ? "slide-in-from-left" : "slide-in-from-right"

  return (
    <aside
      data-slot="aside-content"
      className={cn(
        "shrink-0 animate-in",
        width,
        slideAnimation,
        sticky && "sticky top-0",
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  )
}

DataTableAsideContent.displayName = "DataTableAsideContent"

function DataTableAsideHeader({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      data-slot="aside-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

DataTableAsideHeader.displayName = "DataTableAsideHeader"

function DataTableAsideTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      data-slot="aside-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

DataTableAsideTitle.displayName = "DataTableAsideTitle"

function DataTableAsideDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"p">) {
  return (
    <p
      data-slot="aside-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

DataTableAsideDescription.displayName = "DataTableAsideDescription"

interface DataTableAsideCloseProps
  extends React.ComponentPropsWithoutRef<"button"> {
  showIcon?: boolean
}

function DataTableAsideClose({
  className,
  showIcon = true,
  children,
  ...props
}: DataTableAsideCloseProps) {
  const { onOpenChange } = useDataTableAside()

  return (
    <button
      data-slot="aside-close"
      type="button"
      className={cn(
        "rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none",
        className,
      )}
      onClick={() => onOpenChange(false)}
      {...props}
    >
      {showIcon && <XIcon className="size-4" />}
      {children}
      {showIcon && !children && <span className="sr-only">Close</span>}
    </button>
  )
}

DataTableAsideClose.displayName = "DataTableAsideClose"

export {
  DataTableAside,
  DataTableAsideTrigger,
  DataTableAsideContent,
  DataTableAsideHeader,
  DataTableAsideTitle,
  DataTableAsideDescription,
  DataTableAsideClose,
}
