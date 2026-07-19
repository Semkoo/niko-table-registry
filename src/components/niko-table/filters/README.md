# filters/

Direct-prop primitives (`Table*` prefix). Pass `table` (or related TanStack pieces) yourself. Use when building custom wrappers or managing the table instance outside `DataTableRoot` context.

Includes filter UIs, pagination, export, column header pieces, and low-level DnD primitives (`TableRowDndProvider`, `TableColumnDndProvider`, …).

```tsx
import { TableSearchFilter } from "@/components/niko-table/filters/table-search-filter"
import { TablePagination } from "@/components/niko-table/filters/table-pagination"

<TableSearchFilter table={table} />
```

Context-aware counterparts live in [`../components/`](../components/).

Docs: [Filters overview](https://niko-table.com/niko-table/overview/filters/) · parent [README](../README.md)
