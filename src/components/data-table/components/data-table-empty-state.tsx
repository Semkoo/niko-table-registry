"use client"

import React from "react"
import { cn } from "@/lib/utils"

// ============================================================================
// Context for Empty State
// ============================================================================

interface DataTableEmptyStateContextValue {
  isFiltered: boolean
}

const DataTableEmptyStateContext =
  React.createContext<DataTableEmptyStateContextValue | null>(null)

function useDataTableEmptyState() {
  const context = React.useContext(DataTableEmptyStateContext)
  if (!context) {
    throw new Error(
      "Empty state components must be used within DataTableEmptyBody",
    )
  }
  return context
}

// ============================================================================
// Empty State Root
// ============================================================================

export interface DataTableEmptyStateProps {
  children: React.ReactNode
  isFiltered: boolean
  className?: string
}

/**
 * Root component for empty state composition.
 * Provides context to child components about filter state.
 *
 * @internal - Used by DataTableEmptyBody and DataTableVirtualizedEmptyBody
 */
export function DataTableEmptyState({
  children,
  isFiltered,
  className,
}: DataTableEmptyStateProps) {
  return (
    <DataTableEmptyStateContext.Provider value={{ isFiltered }}>
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 py-4",
          className,
        )}
      >
        {children}
      </div>
    </DataTableEmptyStateContext.Provider>
  )
}

// ============================================================================
// Empty State Icon
// ============================================================================

export interface DataTableEmptyIconProps {
  children: React.ReactNode
  className?: string
}

/**
 * Icon component for empty state.
 * Displays an icon above the empty message.
 *
 * @example
 * <DataTableEmptyIcon>
 *   <PackageOpen />
 * </DataTableEmptyIcon>
 */
export function DataTableEmptyIcon({
  children,
  className,
}: DataTableEmptyIconProps) {
  return (
    <div className={cn("text-muted-foreground/50", className)}>{children}</div>
  )
}

DataTableEmptyIcon.displayName = "DataTableEmptyIcon"

// ============================================================================
// Empty State Message
// ============================================================================

export interface DataTableEmptyMessageProps {
  children: React.ReactNode
  className?: string
}

/**
 * Message component for empty state when no data exists.
 * Only shows when table is not filtered.
 *
 * @example
 * <DataTableEmptyMessage>
 *   <p className="font-semibold">No products found</p>
 *   <p className="text-sm text-muted-foreground">
 *     Get started by adding your first product
 *   </p>
 * </DataTableEmptyMessage>
 */
export function DataTableEmptyMessage({
  children,
  className,
}: DataTableEmptyMessageProps) {
  const { isFiltered } = useDataTableEmptyState()

  if (isFiltered) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  )
}

DataTableEmptyMessage.displayName = "DataTableEmptyMessage"

// ============================================================================
// Empty State Filtered Message
// ============================================================================

export interface DataTableEmptyFilteredMessageProps {
  children: React.ReactNode
  className?: string
}

/**
 * Message component for empty state when filters are active.
 * Only shows when table is filtered and has no results.
 *
 * @example
 * <DataTableEmptyFilteredMessage>
 *   No matches found for your search
 * </DataTableEmptyFilteredMessage>
 */
export function DataTableEmptyFilteredMessage({
  children,
  className,
}: DataTableEmptyFilteredMessageProps) {
  const { isFiltered } = useDataTableEmptyState()

  if (!isFiltered) return null

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  )
}

DataTableEmptyFilteredMessage.displayName = "DataTableEmptyFilteredMessage"

// ============================================================================
// Empty State Actions
// ============================================================================

export interface DataTableEmptyActionsProps {
  children: React.ReactNode
  className?: string
}

/**
 * Actions component for empty state.
 * Displays action buttons or links (e.g., "Add Item", "Clear Filters").
 *
 * @example
 * <DataTableEmptyActions>
 *   <Button onClick={handleAdd}>Add Product</Button>
 * </DataTableEmptyActions>
 */
export function DataTableEmptyActions({
  children,
  className,
}: DataTableEmptyActionsProps) {
  return <div className={cn("mt-2 flex gap-2", className)}>{children}</div>
}

DataTableEmptyActions.displayName = "DataTableEmptyActions"

// ============================================================================
// Convenience Components
// ============================================================================

export interface DataTableEmptyTitleProps {
  children: React.ReactNode
  className?: string
}

/**
 * Title component for empty state messages.
 * Convenience wrapper for consistent title styling.
 *
 * @example
 * <DataTableEmptyMessage>
 *   <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
 *   <DataTableEmptyDescription>
 *     Get started by adding your first product
 *   </DataTableEmptyDescription>
 * </DataTableEmptyMessage>
 */
export function DataTableEmptyTitle({
  children,
  className,
}: DataTableEmptyTitleProps) {
  return <p className={cn("font-semibold", className)}>{children}</p>
}

DataTableEmptyTitle.displayName = "DataTableEmptyTitle"

export interface DataTableEmptyDescriptionProps {
  children: React.ReactNode
  className?: string
}

/**
 * Description component for empty state messages.
 * Convenience wrapper for consistent description styling.
 *
 * @example
 * <DataTableEmptyMessage>
 *   <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
 *   <DataTableEmptyDescription>
 *     Get started by adding your first product
 *   </DataTableEmptyDescription>
 * </DataTableEmptyMessage>
 */
export function DataTableEmptyDescription({
  children,
  className,
}: DataTableEmptyDescriptionProps) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
  )
}

DataTableEmptyDescription.displayName = "DataTableEmptyDescription"

