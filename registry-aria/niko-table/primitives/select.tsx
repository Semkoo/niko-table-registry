"use client"

/**
 * Niko Table's select primitive, React Aria build. Radix-shaped API
 * (`Select value onValueChange open onOpenChange disabled`, `SelectTrigger`,
 * `SelectValue placeholder`, `SelectContent`, `SelectItem value`) on top of the
 * React Aria shadcn select (a React Aria `Select` with a `ListBox`).
 */
import * as React from "react"

import {
  Select as SelectRoot,
  SelectContent as SelectPopover,
  SelectItem as SelectOption,
  SelectTrigger as SelectButton,
  SelectValue as SelectValuePrimitive,
} from "@/components/ui/select"

/** Plain text of a node tree, for React Aria's type-to-select. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode }>(node))
    return textOf(node.props.children)
  return ""
}

function Select({
  value,
  defaultValue,
  onValueChange,
  open,
  onOpenChange,
  disabled,
  required,
  name,
  children,
}: {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  required?: boolean
  name?: string
  children?: React.ReactNode
}) {
  // React Aria labels the select on its root; Radix call sites label the
  // trigger, so lift the trigger's aria-label / aria-labelledby. Only a
  // direct-child SelectTrigger is found; a wrapped one leaves it unlabelled.
  const trigger = React.Children.toArray(children).find(
    (child): child is React.ReactElement<SelectTriggerProps> =>
      React.isValidElement(child) && child.type === SelectTrigger,
  )
  return (
    <SelectRoot
      aria-label={trigger?.props["aria-label"]}
      aria-labelledby={trigger?.props["aria-labelledby"]}
      value={value}
      defaultValue={defaultValue}
      onChange={key => {
        if (key !== null) onValueChange?.(String(key))
      }}
      isOpen={open}
      onOpenChange={onOpenChange}
      isDisabled={disabled}
      isRequired={required}
      name={name}
    >
      {children}
    </SelectRoot>
  )
}

interface SelectTriggerProps {
  className?: string
  size?: "sm" | "default"
  id?: string
  title?: string
  children?: React.ReactNode
  /** Read by `Select`, which labels the React Aria select with it. */
  "aria-label"?: string
  /** Read by `Select`, which labels the React Aria select with it. */
  "aria-labelledby"?: string
  /** Radix wiring; React Aria links the trigger to its list itself. */
  "aria-controls"?: string
}

function SelectTrigger({
  className,
  size,
  id,
  title,
  children,
}: SelectTriggerProps) {
  return (
    <SelectButton className={className} size={size} id={id}>
      {/* React Aria's button takes no `title`; keep the hint on its content. */}
      <span title={title} className="contents">
        {children}
      </span>
    </SelectButton>
  )
}

function SelectValue({
  placeholder,
  className,
}: {
  placeholder?: React.ReactNode
  className?: string
}) {
  return (
    <SelectValuePrimitive className={className}>
      {({ isPlaceholder, defaultChildren }) =>
        isPlaceholder ? placeholder : defaultChildren
      }
    </SelectValuePrimitive>
  )
}

function SelectContent({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
  /** Radix wiring; React Aria links the trigger to its list itself. */
  id?: string
  /** Radix option; ignored, React Aria always positions as a popover. */
  position?: "popper" | "item-aligned"
}) {
  return <SelectPopover className={className}>{children}</SelectPopover>
}

function SelectItem({
  value,
  disabled,
  className,
  children,
}: {
  value: string
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}) {
  return (
    <SelectOption
      id={value}
      isDisabled={disabled}
      className={className}
      textValue={textOf(children) || value}
    >
      {children}
    </SelectOption>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
