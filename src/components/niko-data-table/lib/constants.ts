/**
 * Data table constants
 * @description Centralized constants for the data table components
 */

/**
 * Join operator constants for combining multiple filters.
 */
export const JOIN_OPERATORS = {
  /** Logical AND (all filters must match) */
  AND: "and",
  /** Logical OR (any filter can match) */
  OR: "or",
  /** Mixed logic (combination of AND/OR) */
  MIXED: "mixed",
} as const

/**
 * Filter operator constants defining the comparison logic.
 * Naming follows SQL/PostgREST standards (ilike, eq, ne, etc.).
 */
export const FILTER_OPERATORS = {
  /** SQL ILIKE (Case-insensitive search) */
  ILIKE: "ilike",
  /** SQL NOT ILIKE */
  NOT_ILIKE: "not.ilike",
  /** SQL EQUAL (=) */
  EQ: "eq",
  /** SQL NOT EQUAL (!=) */
  NEQ: "neq",
  /** SQL IN (one of) */
  IN: "in",
  /** SQL NOT IN (none of) */
  NOT_IN: "not.in",
  /** Value is null or empty string */
  EMPTY: "empty",
  /** Value is not null and not empty string */
  NOT_EMPTY: "not.empty",
  /** SQL LESS THAN (<) */
  LT: "lt",
  /** SQL LESS THAN OR EQUAL (<=) */
  LTE: "lte",
  /** SQL GREATER THAN (>) */
  GT: "gt",
  /** SQL GREATER THAN OR EQUAL (>=) */
  GTE: "gte",
  /** SQL BETWEEN (range) */
  BETWEEN: "between",
  /** Relative date calculation (e.g., "today", "last-7-days") */
  RELATIVE: "relative",
} as const

/**
 * Filter variant constants defining the UI control type.
 */
export const FILTER_VARIANTS = {
  /** Standard text input */
  TEXT: "text",
  /** Numeric input */
  NUMBER: "number",
  /** Two-value range input */
  RANGE: "range",
  /** Single date picker */
  DATE: "date",
  /** Date range picker */
  DATE_RANGE: "date_range",
  /** Single select dropdown */
  SELECT: "select",
  /** Multi-select dropdown */
  MULTI_SELECT: "multi_select",
  /** Checkbox or toggle */
  BOOLEAN: "boolean",
} as const

// ============================================================================
// DERIVED TYPES
// ============================================================================

/** Join operators for combining multiple filters */
export type JoinOperator = (typeof JOIN_OPERATORS)[keyof typeof JOIN_OPERATORS]

/** Filter operators supported by the data table */
export type FilterOperator =
  (typeof FILTER_OPERATORS)[keyof typeof FILTER_OPERATORS]

/** Filter variants supported by the data table (UI control type) */
export type FilterVariant =
  (typeof FILTER_VARIANTS)[keyof typeof FILTER_VARIANTS]

// ============================================================================
// DEFAULT VALUES & UI CONFIG
// ============================================================================

/** Global default values */
export const DEFAULT_VALUES = {
  JOIN_OPERATOR: JOIN_OPERATORS.AND,
  PAGE_SIZE: 10,
  PAGE_INDEX: 0,
} as const

/** UI-related constraints and settings */
export const UI_CONSTANTS = {
  /** Max characters allowed for a filter ID */
  FILTER_ID_MAX_LENGTH: 100,
  /** Default max height for scrollable filter popovers */
  MAX_FILTER_DISPLAY_HEIGHT: 300,
  /** Default debounce delay in milliseconds for search inputs */
  DEBOUNCE_DELAY: 300,
} as const

/** Default keyboard shortcut key mappings */
export const KEYBOARD_SHORTCUTS = {
  /** Open/Toggle filter menu */
  FILTER_TOGGLE: "f",
  /** Remove active filter (usually combined with Shift) */
  FILTER_REMOVE: "f",
  /** Close active UI elements */
  ESCAPE: "escape",
  /** Confirm or submit active action */
  ENTER: "enter",
  /** Remove character or navigate back */
  BACKSPACE: "backspace",
  /** Item deletion */
  DELETE: "delete",
} as const

/** Standard internalized error messages */
export const ERROR_MESSAGES = {
  /** Thrown when using the old global operator pattern */
  DEPRECATED_GLOBAL_JOIN_OPERATOR:
    "Global join operator is deprecated. Use individual filter join operators.",
  /** General configuration error */
  INVALID_FILTER_CONFIGURATION: "Invalid filter configuration provided.",
  /** Thrown when mandatory metadata is missing from columns */
  MISSING_COLUMN_META: "Column metadata is required for filtering.",
} as const
