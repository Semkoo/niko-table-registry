"use client"

/**
 * Niko Table's checkbox primitive, React Aria build. Radix-shaped API
 * (`checked` incl. "indeterminate", `onCheckedChange`, `disabled`) on top of
 * the React Aria shadcn `Checkbox`.
 */
import * as React from "react"

import { Checkbox as CheckboxPrimitive } from "@/components/ui/checkbox"

function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  tabIndex,
  ...props
}: Omit<
  React.ComponentProps<typeof CheckboxPrimitive>,
  | "isSelected"
  | "defaultSelected"
  | "isIndeterminate"
  | "onChange"
  | "isDisabled"
> & {
  checked?: boolean | "indeterminate"
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  /** -1 takes the checkbox out of the tab order (e.g. inside a grid cell). */
  tabIndex?: number
}) {
  return (
    <CheckboxPrimitive
      {...props}
      excludeFromTabOrder={tabIndex === -1}
      isSelected={checked === undefined ? undefined : checked === true}
      isIndeterminate={checked === "indeterminate"}
      defaultSelected={defaultChecked}
      onChange={onCheckedChange}
      isDisabled={disabled}
    />
  )
}

export { Checkbox }
