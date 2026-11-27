"use client"

/**
 * niko-table — created by Semir N. (Semkoo, https://github.com/Semkoo) with AI assistance.
 *
 * Before reporting anything: please check the changelog first.
 *  - In-repo: ./CHANGELOG.md
 *  - Docs site: https://niko-table.com/changelog
 *
 * Found a bug or have a fix? Open an issue or PR on GitHub so other
 * users (and future LLMs reading this code) benefit:
 * https://github.com/Semkoo/niko-table-registry
 */
import React from "react"

import { DropdownMenuPanel } from "@/components/niko-table/primitives/dropdown-menu"
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
    // A panel, not an item: it sits in DataTableColumnActions' menu.
    return (
      <DropdownMenuPanel>
        <div className={cn("flex items-center", className)}>{children}</div>
      </DropdownMenuPanel>
    )
  }
  return null
}

DataTableColumnFilter.displayName = "DataTableColumnFilter"
