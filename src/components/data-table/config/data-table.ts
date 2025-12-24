/**
 * @file Data Table Configuration
 * Defines runtime configuration values for the Data Table component.
 * This includes filter operators, sort icons, and other constants.
 
 */

import type { LucideIcon } from "lucide-react"
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
  ArrowUpDown,
  Calendar,
  Check,
  X as XIcon,
} from "lucide-react"
import type { FilterOperator, FilterVariant, JoinOperator } from "../types"
import {
  JOIN_OPERATORS,
  FILTER_OPERATORS,
  FILTER_VARIANTS,
} from "../lib/constants"

export type SortIconVariant = "text" | "number" | "date" | "boolean"

interface SortIcons {
  asc: LucideIcon
  desc: LucideIcon
  unsorted: LucideIcon
}

interface SortLabels {
  asc: string
  desc: string
}

export const SORT_ICONS: Record<SortIconVariant, SortIcons> = {
  text: {
    asc: ArrowDownAZ,
    desc: ArrowDownZA,
    unsorted: ArrowUpDown,
  },
  number: {
    asc: ArrowDown01,
    desc: ArrowDown10,
    unsorted: ArrowUpDown,
  },
  date: {
    asc: ArrowUpDown,
    desc: ArrowUpDown,
    unsorted: Calendar,
  },
  boolean: {
    asc: XIcon, // False First
    desc: Check, // True First
    unsorted: ArrowUpDown,
  },
}

export const SORT_LABELS: Record<SortIconVariant, SortLabels> = {
  text: {
    asc: "Asc",
    desc: "Desc",
  },
  number: {
    asc: "Low to High",
    desc: "High to Low",
  },
  date: {
    asc: "Oldest First",
    desc: "Newest First",
  },
  boolean: {
    asc: "False First",
    desc: "True First",
  },
}

/**
 * @credit Adapted from React Table's default config
 * @see https://react-table.tanstack.com/docs/overview
 */

export const dataTableConfig = {
  debounceMs: 300,
  throttleMs: 50,
  textOperators: [
    { label: "Contains", value: FILTER_OPERATORS.ILIKE },
    { label: "Does not contain", value: FILTER_OPERATORS.NOT_ILIKE },
    { label: "Is", value: FILTER_OPERATORS.EQ },
    { label: "Is not", value: FILTER_OPERATORS.NEQ },
    { label: "Is empty", value: FILTER_OPERATORS.EMPTY },
    { label: "Is not empty", value: FILTER_OPERATORS.NOT_EMPTY },
  ] satisfies { label: string; value: FilterOperator }[],
  numericOperators: [
    { label: "Is", value: FILTER_OPERATORS.EQ },
    { label: "Is not", value: FILTER_OPERATORS.NEQ },
    { label: "Is less than", value: FILTER_OPERATORS.LT },
    {
      label: "Is less than or equal to",
      value: FILTER_OPERATORS.LTE,
    },
    { label: "Is greater than", value: FILTER_OPERATORS.GT },
    {
      label: "Is greater than or equal to",
      value: FILTER_OPERATORS.GTE,
    },
    { label: "Is between", value: FILTER_OPERATORS.BETWEEN },
    { label: "Is empty", value: FILTER_OPERATORS.EMPTY },
    { label: "Is not empty", value: FILTER_OPERATORS.NOT_EMPTY },
  ] satisfies { label: string; value: FilterOperator }[],
  dateOperators: [
    { label: "Is", value: FILTER_OPERATORS.EQ },
    { label: "Is not", value: FILTER_OPERATORS.NEQ },
    { label: "Is before", value: FILTER_OPERATORS.LT },
    { label: "Is after", value: FILTER_OPERATORS.GT },
    { label: "Is on or before", value: FILTER_OPERATORS.LTE },
    { label: "Is on or after", value: FILTER_OPERATORS.GTE },
    { label: "Is between", value: FILTER_OPERATORS.BETWEEN },
    {
      label: "Is relative to today",
      value: FILTER_OPERATORS.RELATIVE,
    },
    { label: "Is empty", value: FILTER_OPERATORS.EMPTY },
    { label: "Is not empty", value: FILTER_OPERATORS.NOT_EMPTY },
  ] satisfies { label: string; value: FilterOperator }[],
  selectOperators: [
    { label: "Is", value: FILTER_OPERATORS.EQ },
    { label: "Is not", value: FILTER_OPERATORS.NEQ },
    { label: "Is empty", value: FILTER_OPERATORS.EMPTY },
    { label: "Is not empty", value: FILTER_OPERATORS.NOT_EMPTY },
  ] satisfies { label: string; value: FilterOperator }[],
  multiSelectOperators: [
    { label: "Has any of", value: FILTER_OPERATORS.IN },
    { label: "Has none of", value: FILTER_OPERATORS.NOT_IN },
    { label: "Is empty", value: FILTER_OPERATORS.EMPTY },
    { label: "Is not empty", value: FILTER_OPERATORS.NOT_EMPTY },
  ] satisfies { label: string; value: FilterOperator }[],
  booleanOperators: [
    { label: "Is", value: FILTER_OPERATORS.EQ },
    { label: "Is not", value: FILTER_OPERATORS.NEQ },
  ] satisfies { label: string; value: FilterOperator }[],
  sortOrders: [
    { label: "Asc", value: "asc" as const },
    { label: "Desc", value: "desc" as const },
  ],
  filterVariants: [
    FILTER_VARIANTS.TEXT,
    FILTER_VARIANTS.NUMBER,
    FILTER_VARIANTS.RANGE,
    FILTER_VARIANTS.DATE,
    FILTER_VARIANTS.DATE_RANGE,
    FILTER_VARIANTS.BOOLEAN,
    FILTER_VARIANTS.SELECT,
    FILTER_VARIANTS.MULTI_SELECT,
  ] satisfies FilterVariant[],
  operators: [
    FILTER_OPERATORS.ILIKE,
    FILTER_OPERATORS.NOT_ILIKE,
    FILTER_OPERATORS.EQ,
    FILTER_OPERATORS.NEQ,
    FILTER_OPERATORS.IN,
    FILTER_OPERATORS.NOT_IN,
    FILTER_OPERATORS.EMPTY,
    FILTER_OPERATORS.NOT_EMPTY,
    FILTER_OPERATORS.LT,
    FILTER_OPERATORS.LTE,
    FILTER_OPERATORS.GT,
    FILTER_OPERATORS.GTE,
    FILTER_OPERATORS.BETWEEN,
    FILTER_OPERATORS.RELATIVE,
  ] satisfies FilterOperator[],
  joinOperators: [
    JOIN_OPERATORS.AND,
    JOIN_OPERATORS.OR,
  ] satisfies JoinOperator[],
} as const

export type DataTableConfig = typeof dataTableConfig
