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
  return (
    <SelectRoot
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

function SelectTrigger({
  className,
  size,
  id,
  title,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  className?: string
  size?: "sm" | "default"
  id?: string
  title?: string
  children?: React.ReactNode
  "aria-label"?: string
  "aria-labelledby"?: string
  /** Radix wiring; React Aria links the trigger to its list itself. */
  "aria-controls"?: string
}) {
  return (
    <SelectButton
      className={className}
      size={size}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
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
      textValue={typeof children === "string" ? children : value}
    >
      {children}
    </SelectOption>
  )
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
