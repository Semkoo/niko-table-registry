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
import { Button } from "@/components/ui/button"
import { Columns3 } from "lucide-react"

import { useDataGridColumns } from "../core/data-grid-columns-context"

/**
 * Toolbar button that appends a new column (opens rename so the user can name
 * it immediately). Requires a `<DataGridColumns>` ancestor.
 */
export function DataGridAddColumnButton({
  label = "Add column",
}: {
  label?: string
}) {
  const { addColumn, beginRename } = useDataGridColumns()
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        const created = addColumn()
        beginRename(created.id)
      }}
    >
      <Columns3 className="size-4" />
      {label}
    </Button>
  )
}
