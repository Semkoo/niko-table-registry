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
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  Pencil,
  Shapes,
  Trash2,
} from "lucide-react"

import { useColumnHeaderContext } from "../../components/data-table-column-header"
import { useDataGridColumns } from "../core/data-grid-columns-context"

/**
 * Dynamic-column actions for the header dropdown — Rename, Insert left/right,
 * Move left/right, Delete. Reads the column from the header context and the
 * mutations from `<DataGridColumns>`. Drop it inside `<DataTableColumnActions>`
 * alongside the built-in Sort / Pin / Hide options:
 *
 * @example
 * <DataTableColumnActions>
 *   <DataTableColumnSortOptions />
 *   <GridColumnMenuOptions />
 * </DataTableColumnActions>
 */
export function GridColumnMenuOptions({
  withSeparator = true,
}: {
  withSeparator?: boolean
}) {
  const { column } = useColumnHeaderContext(true)
  const {
    columns,
    columnTypes,
    changeColumnType,
    addColumn,
    removeColumn,
    moveColumn,
    beginRename,
  } = useDataGridColumns()

  const id = column.id
  const index = columns.findIndex(c => c.id === id)
  const currentType = columns[index]?.type
  const isFirst = index <= 0
  const isLast = index === columns.length - 1
  const isOnly = columns.length <= 1

  return (
    <>
      {withSeparator && <DropdownMenuSeparator />}
      <DropdownMenuGroup>
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Column
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => beginRename(id)}>
          <Pencil className="mr-2 size-4 text-muted-foreground/70" />
          Rename
        </DropdownMenuItem>
        {columnTypes.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Shapes className="mr-2 size-4 text-muted-foreground/70" />
              Column type
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={currentType}
                onValueChange={v => changeColumnType(id, v)}
              >
                {columnTypes.map(t => (
                  <DropdownMenuRadioItem key={t.value} value={t.value}>
                    {t.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        <DropdownMenuItem onClick={() => addColumn({}, index)}>
          <ArrowLeftToLine className="mr-2 size-4 text-muted-foreground/70" />
          Insert column left
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => addColumn({}, index + 1)}>
          <ArrowRightToLine className="mr-2 size-4 text-muted-foreground/70" />
          Insert column right
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isFirst} onClick={() => moveColumn(id, -1)}>
          <ArrowLeft className="mr-2 size-4 text-muted-foreground/70" />
          Move left
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLast} onClick={() => moveColumn(id, 1)}>
          <ArrowRight className="mr-2 size-4 text-muted-foreground/70" />
          Move right
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={isOnly}
          onClick={() => removeColumn(id)}
        >
          <Trash2 className="mr-2 size-4" />
          Delete column
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </>
  )
}
