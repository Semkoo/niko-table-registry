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
import type { Column } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useDerivedColumnTitle } from "../hooks/use-derived-column-title"

/**
 * Renders the column title.
 */
export function TableColumnTitle<TData, TValue>({
  column,
  title,
  className,
  children,
}: {
  column: Column<TData, TValue>
  title?: string
  className?: string
  children?: React.ReactNode
}) {
  const derivedTitle = useDerivedColumnTitle(column, column.id, title)

  return (
    <div
      className={cn(
        "truncate py-0.5 text-sm font-semibold transition-colors",
        className,
      )}
    >
      {children ?? derivedTitle}
    </div>
  )
}

TableColumnTitle.displayName = "TableColumnTitle"
