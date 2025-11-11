/**
 * Data table constants
 * @description Centralized constants for the data table components
 */

// Join operator constants
export const JOIN_OPERATORS = {
  AND: "and",
  OR: "or",
  MIXED: "mixed",
} as const

// Filter operator constants
export const FILTER_OPERATORS = {
  I_LIKE: "iLike",
  NOT_I_LIKE: "notILike",
  EQUAL: "eq",
  NOT_EQUAL: "ne",
  IN_ARRAY: "inArray",
  NOT_IN_ARRAY: "notInArray",
  IS_EMPTY: "isEmpty",
  IS_NOT_EMPTY: "isNotEmpty",
  LESS_THAN: "lt",
  LESS_THAN_OR_EQUAL: "lte",
  GREATER_THAN: "gt",
  GREATER_THAN_OR_EQUAL: "gte",
  IS_BETWEEN: "isBetween",
  IS_RELATIVE_TO_TODAY: "isRelativeToToday",
} as const

// Filter variant constants
export const FILTER_VARIANTS = {
  TEXT: "text",
  NUMBER: "number",
  RANGE: "range",
  DATE: "date",
  DATE_RANGE: "dateRange",
  SELECT: "select",
  MULTI_SELECT: "multiSelect",
  BOOLEAN: "boolean",
} as const

// Default values
export const DEFAULT_VALUES = {
  JOIN_OPERATOR: JOIN_OPERATORS.AND,
  PAGE_SIZE: 10,
  PAGE_INDEX: 0,
} as const

// UI Constants
export const UI_CONSTANTS = {
  FILTER_ID_MAX_LENGTH: 100,
  MAX_FILTER_DISPLAY_HEIGHT: 300,
  DEBOUNCE_DELAY: 300,
} as const

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  FILTER_TOGGLE: "f",
  FILTER_REMOVE: "f", // with shift
  ESCAPE: "escape",
  ENTER: "enter",
  BACKSPACE: "backspace",
  DELETE: "delete",
} as const

// Error messages
export const ERROR_MESSAGES = {
  DEPRECATED_GLOBAL_JOIN_OPERATOR:
    "Global join operator is deprecated. Use individual filter join operators.",
  INVALID_FILTER_CONFIGURATION: "Invalid filter configuration provided.",
  MISSING_COLUMN_META: "Column metadata is required for filtering.",
} as const
