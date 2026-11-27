"use client"

/**
 * Niko Table's slider primitive, React Aria build. Radix-shaped API (`value`
 * and `onValueChange` as arrays, `min` / `max` / `step`, `disabled`) on top of
 * the React Aria shadcn `Slider`.
 */
import * as React from "react"

import { Slider as SliderPrimitive } from "@/components/ui/slider"

function Slider({
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  min,
  max,
  disabled,
  ...props
}: Omit<
  React.ComponentProps<typeof SliderPrimitive>,
  | "value"
  | "defaultValue"
  | "onChange"
  | "onChangeEnd"
  | "isDisabled"
  | "minValue"
  | "maxValue"
> & {
  value?: readonly number[]
  defaultValue?: readonly number[]
  onValueChange?: (value: number[]) => void
  onValueCommit?: (value: number[]) => void
  min?: number
  max?: number
  disabled?: boolean
}) {
  const toArray = (next: number | number[]) =>
    Array.isArray(next) ? next : [next]
  return (
    <SliderPrimitive
      {...props}
      value={value ? [...value] : undefined}
      defaultValue={defaultValue ? [...defaultValue] : undefined}
      onChange={next => onValueChange?.(toArray(next))}
      onChangeEnd={next => onValueCommit?.(toArray(next))}
      minValue={min}
      maxValue={max}
      isDisabled={disabled}
    />
  )
}

export { Slider }
