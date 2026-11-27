"use client"

/**
 * Niko Table's calendar primitive, React Aria build. The react-day-picker
 * shaped API Niko Table uses (`mode` "single" | "range", `selected` /
 * `onSelect` with JS `Date`s, `defaultMonth`, `autoFocus`) on top of the React
 * Aria shadcn `Calendar` / `RangeCalendar`, converting to and from
 * `@internationalized/date` in the user's time zone.
 */
import {
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
  type CalendarDate,
} from "@internationalized/date"

import {
  Calendar as CalendarPrimitive,
  RangeCalendar,
} from "@/components/ui/calendar"

/** Same shape as react-day-picker's `DateRange`. */
type DateRange = { from: Date | undefined; to?: Date | undefined }

type CalendarProps = {
  className?: string
  /** react-day-picker option; React Aria's calendar always has month/year pickers. */
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years"
  defaultMonth?: Date
  autoFocus?: boolean
  "aria-label"?: string
} & (
  | {
      mode: "single"
      selected?: Date
      onSelect?: (date: Date | undefined) => void
    }
  | {
      mode: "range"
      selected?: DateRange
      onSelect?: (range: DateRange | undefined) => void
    }
)

function toCalendarValue(date: Date | undefined): CalendarDate | null {
  return date ? toCalendarDate(fromDate(date, getLocalTimeZone())) : null
}

function Calendar(props: CalendarProps) {
  const common = {
    className: props.className,
    autoFocus: props.autoFocus,
    "aria-label": props["aria-label"],
    defaultFocusedValue: toCalendarValue(props.defaultMonth) ?? undefined,
  }

  if (props.mode === "range") {
    const { selected, onSelect } = props
    const start = toCalendarValue(selected?.from)
    const end = toCalendarValue(selected?.to)
    return (
      <RangeCalendar
        {...common}
        value={start && end ? { start, end } : null}
        onChange={range =>
          onSelect?.({
            from: range.start.toDate(getLocalTimeZone()),
            to: range.end.toDate(getLocalTimeZone()),
          })
        }
      />
    )
  }

  const { selected, onSelect } = props
  return (
    <CalendarPrimitive
      {...common}
      value={toCalendarValue(selected)}
      onChange={date => onSelect?.(date.toDate(getLocalTimeZone()))}
    />
  )
}

export { Calendar }
