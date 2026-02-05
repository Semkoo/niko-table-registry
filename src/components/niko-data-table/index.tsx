"use client"

// Core components
export * from "./core"

// Filter components (core implementation)
export * from "./filters"

// Configuration and utilities
export * as config from "./config"
export {
  JOIN_OPERATORS,
  FILTER_OPERATORS,
  FILTER_VARIANTS,
  DEFAULT_VALUES,
  UI_CONSTANTS,
  KEYBOARD_SHORTCUTS,
  ERROR_MESSAGES,
  SYSTEM_COLUMN_IDS,
  SYSTEM_COLUMN_ID_LIST,
} from "./lib/constants"

// Hooks
export * from "./hooks"

// Types (explicitly re-export DataTable to avoid ambiguity)
export { DataTable } from "./core"
export * from "./types"

// All components (context-aware and reusable UI)
export * from "./components"

// Re-export types that might be useful
export type { ColumnDef, Table } from "@tanstack/react-table"
