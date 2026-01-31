"use client"

import React from "react"

import { cn } from "@/lib/utils"

/**
 * Wrapper for groups of column filters.
 */
export function DataTableColumnFilter({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  if (children) {
    return <div className={cn("flex items-center", className)}>{children}</div>
  }
  return null
}

DataTableColumnFilter.displayName = "DataTableColumnFilter"
