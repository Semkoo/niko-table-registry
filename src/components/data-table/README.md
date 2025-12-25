# NikoTable - React Data Table Composition System

**Nobody's table, everyone's solution.**

NikoTable provides a modern, flexible composition-based approach to building advanced data tables with hybrid state management. All components are self-contained and designed for maximum flexibility and reusability.

## Key Benefits

1. **Flexibility**: Mix and match components as needed
2. **Reusability**: Components can be used independently
3. **Maintainability**: Smaller, focused components are easier to maintain
4. **Customization**: Easy to create custom layouts and behaviors
5. **Type Safety**: Full TypeScript support with proper generics
6. **Auto-detection**: Features are automatically enabled based on included components
7. **Advanced Features**: Virtualization, row expansion, loading states, and more

## Directory Structure

The composition system is organized into logical directories for better maintainability:

```bash
data-table/
├── core/                    # Essential table components
│   ├── data-table-root.tsx
│   ├── data-table-context.tsx
│   ├── data-table.tsx
│   ├── data-table-error-boundary.tsx
│   ├── data-table-structure.tsx              # Header, Body, EmptyBody, Skeleton, Loading (consolidated for easy copy/paste)
│   └── data-table-virtualized-structure.tsx  # VirtualizedHeader, VirtualizedBody, VirtualizedEmptyBody, VirtualizedSkeleton, VirtualizedLoading (consolidated)
├── actions/                 # Filter, sort, and view components
│   ├── data-table-search-filter.tsx
│   ├── data-table-faceted-filter.tsx
│   ├── data-table-slider-filter.tsx
│   ├── data-table-date-filter.tsx
│   ├── data-table-sort-menu.tsx
│   ├── data-table-filter-menu.tsx
│   ├── data-table-inline-filter.tsx
│   ├── data-table-view-menu.tsx
│   ├── data-table-clear-filter.tsx
│   ├── data-table-pagination.tsx
│   └── data-table-export-button.tsx
├── filters/                 # Advanced filter wrapper components
│   ├── table-date-filter.tsx
│   ├── table-faceted-filter.tsx
│   ├── table-filter-menu.tsx
│   ├── table-range-filter.tsx
│   ├── table-slider-filter.tsx
│   ├── table-sort-menu.tsx
│   ├── table-pagination.tsx
│   └── table-export-button.tsx
├── components/              # Reusable UI components
│   ├── table-column-header.tsx
│   ├── data-table-toolbar-section.tsx
│   ├── data-table-aside.tsx
│   ├── data-table-selection-bar.tsx
│   └── data-table-empty-state.tsx
├── config/                  # Configuration and utilities
│   ├── data-table.ts
│   └── feature-detection.ts
├── types/                   # Type definitions
├── hooks/                   # Custom hooks
├── lib/                     # Utility functions
└── examples/                # Working examples
```

## Architecture

### Core Components

- **`DataTableRoot`**: The main provider component that sets up the table context and TanStack Table instance. Supports both pre-configured table instances and direct props mode.
- **`DataTable`**: The container component that wraps the table structure
- **`DataTableHeader`**: Renders the table header with sortable columns
- **`DataTableBody`**: Renders the table body with rows
- **`DataTableEmptyBody`**: Renders empty state when no data is available
- **`DataTableSkeleton`**: Renders skeleton loading state
- **`DataTableErrorBoundary`**: Error boundary wrapper for robust error handling

### Virtualization Components

For large datasets with optimal performance:

- **`DataTableVirtualizedHeader`**: Virtualized table header
- **`DataTableVirtualizedBody`**: Virtualized table body for rendering thousands of rows
- **`DataTableVirtualizedEmptyBody`**: Empty state for virtualized tables

### Action Components

Comprehensive filtering and management capabilities:

- **`DataTableSearchFilter`**: Global search input with debouncing
- **`DataTableFacetedFilter`**: Multi-select filter for categorical data
- **`DataTableSliderFilter`**: Range slider for numeric values
- **`DataTableDateFilter`**: Date picker for date filtering
- **`DataTableSortMenu`**: Menu for managing column sorting
- **`DataTableFilterMenu`**: Command palette-style interface for quickly adding filters
- **`DataTableInlineFilter`**: Inline filter editor with advanced operators
- **`DataTableViewMenu`**: Column visibility toggle menu
- **`DataTableClearFilter`**: Button to clear all active filters

### Pagination Components

- **`DataTablePagination`**: Full-featured pagination controls with page size selection (located in `actions/`)
- **`TablePagination`**: Alternative pagination component (located in `filters/`)

### Advanced Filter Wrappers

Context-aware wrapper components for advanced filtering:

- **`TableDateFilter`**: Date filtering with context
- **`TableFacetedFilter`**: Faceted filtering with context
- **`TableFilterMenu`**: Filter menu with context
- **`TableRangeFilter`**: Range filtering for numeric/date ranges
- **`TableSliderFilter`**: Slider filtering with context
- **`TableSortMenu`**: Sorting menu with context

### Reusable UI Components

- **`TableColumnHeader`**: Sortable column header with proper styling
- **`DataTableToolbarSection`**: Flexible toolbar container for filters, search, and actions
- **`DataTableAside`**: Sidebar component for filters/actions
- **`DataTableSelectionBar`**: Floating action bar for selected rows
- **`DataTableEmpty*`**: Composition components for empty states (Icon, Message, FilteredMessage, Actions, Title, Description)

### Context System

The `DataTableContext` provides the TanStack Table instance to all child components, allowing them to access table state and methods without prop drilling. Use the `useDataTable()` hook to access the context.

## Advanced Column Configuration

The composition system supports comprehensive column configuration with meta properties for advanced filtering, sorting, and display:

### Column Meta Properties

```tsx
import { TableColumnHeader } from "@/components/data-table/components"
import type { DataTableColumnDef } from "@/components/data-table/types"

const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <TableColumnHeader column={column} />,
    meta: {
      label: "Product Name", // Display label for filters/sorting
      placeholder: "Search products...", // Placeholder text for search
      variant: "text", // Filter variant: text, number, select, etc.
      icon: Text, // Icon component for UI
      unit: "$", // Unit display for numeric fields
      options: [
        // Options for select variants
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
      range: [0, 100], // Range for numeric/date filters
      // Dynamic options (select/multiSelect only)
      // If options are omitted and variant is select/multiSelect, wrappers can auto-generate them
      autoOptions: true, // per-column opt-in/out (defaults to wrapper prop)
      showCounts: true, // show counts next to labels (can be dynamic)
      dynamicCounts: true, // recompute counts from filtered rows
      mergeStrategy: "augment", // preserve | augment | replace relative to static options
    },
    enableColumnFilter: true, // Enable filtering for this column
    enableSorting: true, // Enable sorting for this column
    enableHiding: true, // Allow column to be hidden
  },
]
```

### Supported Filter Variants

- **`text`**: Text input for string filtering
- **`number`**: Number input with optional unit display
- **`select`**: Select dropdown for categorical data
- **`date`**: Date picker for date filtering
- **`boolean`**: Boolean toggle for true/false values

### Column Features

- **`enableColumnFilter`**: Enable/disable filtering for the column
- **`enableSorting`**: Enable/disable sorting for the column (default: true)
- **`enableHiding`**: Allow column to be hidden/shown in view options (default: true)

### Important: Use TableColumnHeader

Always use `TableColumnHeader` for proper column sorting functionality:

```tsx
// ✅ Correct - enables sorting
header: ({ column }) => <TableColumnHeader column={column} />,

// ✅ Also correct - with custom title
header: ({ column }) => <TableColumnHeader column={column} title="Product Name" />,

// ❌ Incorrect - no sorting functionality
header: "Product Name",
```

## Auto-Detection Feature

The composition pattern includes intelligent auto-detection that automatically enables features based on the components you include and column definitions:

- **`<DataTablePagination />`** → Automatically enables pagination
- **`<DataTableSearchFilter />`** → Automatically enables global filtering
- **`<DataTableFacetedFilter />`** or other filter components → Automatically enables column filtering
- **Row selection** → Automatically enabled if columns include a "select" column
- **Row expansion** → Automatically enabled if columns include an "expand" column or `expandedContent` in meta
- **Sorting** → Enabled by default for all columns (can be disabled per column with `enableSorting: false`)

**Key Point**: Features are intelligently detected from your component composition and column configuration. No manual feature flags needed in most cases!

## Usage Patterns

### Simple Table (Minimal)

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
  DataTableEmptyBody,
} from "@/components/data-table"
;<DataTableRoot data={data} columns={columns}>
  <DataTable>
    <DataTableHeader />
    <DataTableBody>
      <DataTableSkeleton />
      <DataTableEmptyBody />
    </DataTableBody>
  </DataTable>
</DataTableRoot>
```

### Basic Table with Pagination

```tsx
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableViewMenu,
} from "@/components/data-table"
;<DataTableRoot data={data} columns={columns}>
  <DataTableToolbarSection className="justify-between">
    <h2 className="text-lg font-semibold">Products</h2>
    <DataTableViewMenu />
  </DataTableToolbarSection>
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
  <DataTablePagination pageSizeOptions={[5, 10, 20]} />
</DataTableRoot>
```

### Advanced Table with Filtering and Sorting

```tsx
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTablePagination,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTableClearFilter,
  DataTableSortMenu,
  DataTableFilterMenu,
  DataTableEmptyBody,
} from "@/components/data-table"
;<DataTableRoot data={data} columns={columns}>
  <DataTableToolbarSection>
    <DataTableToolbarSection className="px-0">
      <DataTableSearchFilter placeholder="Search..." />
      <DataTableViewMenu />
    </DataTableToolbarSection>
    <DataTableToolbarSection className="px-0">
      <DataTableSortMenu className="ml-auto" />
      <DataTableFilterMenu />
      <DataTableClearFilter />
    </DataTableToolbarSection>
  </DataTableToolbarSection>
  <DataTable>
    <DataTableHeader />
    <DataTableBody>
      <DataTableEmptyBody />
    </DataTableBody>
  </DataTable>
  <DataTablePagination />
</DataTableRoot>
```

### Virtualized Table for Large Datasets

```tsx
import {
  DataTableRoot,
  DataTableToolbarSection,
  DataTableSearchFilter,
  DataTable,
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTablePagination,
} from "@/components/data-table"
;<DataTableRoot data={largeData} columns={columns}>
  <DataTableToolbarSection>
    <DataTableSearchFilter placeholder="Search logs..." />
  </DataTableToolbarSection>
  <DataTable>
    <DataTableVirtualizedHeader />
    <DataTableVirtualizedBody height={600}>
      <DataTableVirtualizedEmptyBody />
    </DataTableVirtualizedBody>
  </DataTable>
  <DataTablePagination pageSizeOptions={[50, 100, 200, 500]} />
</DataTableRoot>
```

**✨ Auto-detection**: Features are automatically enabled based on the components you include!

## Component Props

### DataTableRoot

Core provider component that sets up the table context.

**Option 1: Pre-configured table instance**

- `table`: TanStack Table instance (created externally)
- `columns?`: DataTableColumnDef array (optional if using pre-configured table)
- `isLoading?`: Loading state
- `className?`: Additional CSS classes

**Option 2: Direct props mode**

- `columns`: DataTableColumnDef array (required)
- `data`: Table data (required)
- `config?`: Configuration object for feature toggles
- `getRowId?`: Custom row ID function
- `isLoading?`: Loading state
- `className?`: Additional CSS classes
- Event handlers: `onGlobalFilterChange`, `onPaginationChange`, `onSortingChange`, etc.

**Configuration Object (`config`)**

- `enablePagination?`: boolean
- `enableFilters?`: boolean
- `enableSorting?`: boolean (default: true)
- `enableRowSelection?`: boolean
- `enableMultiSort?`: boolean (default: true)
- `enableGrouping?`: boolean
- `enableExpanding?`: boolean
- `manualSorting?`: boolean (for server-side)
- `manualPagination?`: boolean (for server-side)
- `manualFiltering?`: boolean (for server-side)
- `pageCount?`: number (for server-side pagination)
- `initialPageSize?`: number (default: 10)
- `initialPageIndex?`: number (default: 0)

### DataTable

Container component for the table structure.

- `className?`: Additional CSS classes

### DataTableHeader / DataTableVirtualizedHeader

Renders the table header with sortable columns.

- `className?`: Additional CSS classes

### DataTableBody / DataTableVirtualizedBody

Renders the table body with rows.

**DataTableBody:**

- `className?`: Additional CSS classes

**DataTableVirtualizedBody:**

- `height`: Fixed height for virtualization (required)
- `className?`: Additional CSS classes

### DataTableToolbarSection

Flexible toolbar container for organizing filters and actions.

- `className?`: Additional CSS classes
- `children`: React.ReactNode

### DataTablePagination

Full-featured pagination controls.

- `pageSizeOptions?`: number\[] (default: \[10, 20, 30, 40, 50\])
- `className?`: Additional CSS classes

### DataTableSearchFilter

Global search input with debouncing.

- `placeholder?`: string (default: "Search...")
- `className?`: Additional CSS classes

### DataTableViewMenu

Column visibility toggle menu.

- `className?`: Additional CSS classes

### DataTableSortMenu

Menu for managing column sorting.

- `className?`: Additional CSS classes

### DataTableFilterMenu

Command palette-style interface for adding filters.

- `className?`: Additional CSS classes
- `autoOptions?`: boolean (default: true) — auto-generate options for select/multiSelect columns lacking static options
- `showCounts?`: boolean (default: true) — show counts for options
- `dynamicCounts?`: boolean (default: true) — counts reflect currently filtered rows
- `includeColumns?`: string[] — restrict generation to these column ids
- `excludeColumns?`: string[] — skip generation for these column ids
- `limitPerColumn?`: number — cap the number of generated options per column
- `mergeStrategy?`: "preserve" | "augment" | "replace" — how to handle existing static options

### DataTableClearFilter

Button to clear all active filters.

- `className?`: Additional CSS classes

### DataTableInlineFilter

Inline filter editor with advanced operators.

- `className?`: Additional CSS classes
- `autoOptions?`: boolean (default: true)
- `showCounts?`: boolean (default: true)
- `dynamicCounts?`: boolean (default: true)
- `includeColumns?`: string[]
- `excludeColumns?`: string[]
- `limitPerColumn?`: number
- `mergeStrategy?`: "preserve" | "augment" | "replace"

## Dynamic option generation (select/multiSelect)

You can avoid manually listing options for categorical columns. If a column has `meta.variant = "select" | "multiSelect"` and no `meta.options`, `DataTableFilterMenu` and `DataTableInlineFilter` can auto-generate options from your table’s data.

Rules:

- If `meta.options` exist → treated as static.
  - `mergeStrategy = "preserve"` (default): keep as-is.
  - `mergeStrategy = "augment"`: keep your labels/values, add counts to matching values.
  - `mergeStrategy = "replace"`: override with generated options.
- `showCounts` controls whether counts are shown.
- `dynamicCounts` determines whether counts come from filtered rows (true) or all rows (false).
- Per-column `meta.showCounts` and `meta.dynamicCounts` override wrapper props.

Wrapper usage:

```tsx
<DataTableFilterMenu autoOptions showCounts dynamicCounts mergeStrategy="augment" />
<DataTableInlineFilter autoOptions includeColumns={["status", "category"]} />
```

Per-column overrides:

```tsx
const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "status",
    header: ({ column }) => <TableColumnHeader column={column} />,
    enableColumnFilter: true,
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Open", value: "open" },
        { label: "Closed", value: "closed" },
      ],
      mergeStrategy: "augment", // add live counts to existing options
      dynamicCounts: true,
      showCounts: true,
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => <TableColumnHeader column={column} />,
    enableColumnFilter: true,
    meta: {
      label: "Category",
      variant: "multiSelect",
      autoOptions: true, // no options provided → generate from data
      showCounts: true,
      dynamicCounts: true,
    },
  },
]
```

How counts update:

- With `dynamicCounts=true`, counts are computed from `table.getFilteredRowModel()` so they react to other active filters.
- With `dynamicCounts=false`, counts are computed from `table.getCoreRowModel()` (base data).

## Advanced Features

### Virtualization

For large datasets (10,000+ rows), use virtualization components for optimal performance:

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableVirtualizedHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
} from "@/components/data-table"
;<DataTableRoot data={largeData} columns={columns}>
  <DataTable>
    <DataTableVirtualizedHeader />
    <DataTableVirtualizedBody height={600}>
      <DataTableVirtualizedEmptyBody />
    </DataTableVirtualizedBody>
  </DataTable>
</DataTableRoot>
```

### Row Expansion

Add expandable content to rows using the `expandedContent` meta property:

```tsx
const columns: DataTableColumnDef<Product>[] = [
  {
    id: "expand",
    header: "",
    meta: {
      expandedContent: row => (
        <div className="bg-gray-50 p-4">
          <h3>Details for {row.name}</h3>
          <p>{row.description}</p>
        </div>
      ),
    },
  },
  // ... other columns
]
```

### Loading States

Show skeleton loading state during data fetching:

```tsx
import { DataTableSkeleton } from "@/components/data-table"

const [isLoading, setIsLoading] = React.useState(false)

<DataTableRoot data={data} columns={columns} isLoading={isLoading}>
  <DataTable>
    <DataTableHeader />
    <DataTableBody>
      <DataTableSkeleton rows={5} />
      <DataTableEmptyBody />
    </DataTableBody>
  </DataTable>
</DataTableRoot>
```

### Custom Toolbar Actions

```tsx
import { useDataTable } from "@/components/data-table"

function CustomToolbar() {
  const { table } = useDataTable()

  const handleExport = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    console.log(
      "Exporting:",
      selectedRows.map(row => row.original),
    )
  }

  return (
    <DataTableToolbarSection>
      <DataTableSearchFilter placeholder="Search..." />
      <Button onClick={handleExport}>Export Selected</Button>
      <DataTableClearFilter />
    </DataTableToolbarSection>
  )
}

;<DataTableRoot columns={columns} data={data}>
  <CustomToolbar />
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
</DataTableRoot>
```

### Accessing Table Instance

```tsx
import { useDataTable } from "@/components/data-table"

function CustomComponent() {
  const { table, isLoading } = useDataTable()

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const filteredData = table.getFilteredRowModel().rows

  return (
    <div>
      <p>Selected: {selectedRows.length}</p>
      <p>Filtered: {filteredData.length}</p>
      <p>Loading: {isLoading ? "Yes" : "No"}</p>
    </div>
  )
}
```

## Migration from Monolithic Component

### Before (Monolithic)

```tsx
<DataTable
  columns={columns}
  data={data}
  enableRowSelection={true}
  enablePagination={true}
  showToolbar={true}
  showPagination={true}
  enableVirtualization={true}
  customDataTableToolbar={<CustomToolbar />}
  customDataTablePagination={<CustomPagination />}
/>
```

### After (Composition)

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
  DataTablePagination,
} from "@/components/data-table"
;<DataTableRoot columns={columns} data={data}>
  <CustomToolbar />
  <DataTable>
    <DataTableHeader />
    <DataTableVirtualizedBody height={600}>
      <DataTableVirtualizedEmptyBody />
    </DataTableVirtualizedBody>
  </DataTable>
  <CustomPagination />
</DataTableRoot>
```

**Key Changes:**

- Replace single `DataTable` component with composition pattern
- Use `DataTableRoot` as the provider
- Wrap table structure with `DataTable` container
- Use specific header/body components instead of props
- Features auto-detected from component usage
- Row selection auto-enabled by "select" column in columns array

## Examples

See the `examples/` directory for complete working examples:

### Basic Examples

- `simple.tsx`: Minimal table with no toolbar or pagination
- `basic.tsx`: Basic table with sorting, pagination, and column visibility
- `basic-state.tsx`: Basic table with controlled state management
- `search.tsx`: Table with global search functionality
- `search-state.tsx`: Table with search and controlled state

### Advanced Examples

- `advanced.tsx`: Advanced table with filtering, sorting, and multiple filter types
- `advanced-state.tsx`: Advanced table with controlled state management
- `advanced-inline.tsx`: Advanced table with inline filter editing
- `advanced-inline-state.tsx`: Advanced inline table with controlled state
- `advanced-nuqs.tsx`: Advanced table with internal state (no URL persistence)
- `advanced-nuqs-state.tsx`: **NEW** - Advanced table with URL state management using nuqs (state persists in URL)

### Feature-Specific Examples

- `faceted.tsx`: Table with faceted filters for categorical data
- `faceted-state.tsx`: Faceted table with controlled state
- `row-selection.tsx`: Table with row selection capabilities
- `row-selection-state.tsx`: Row selection with controlled state
- `row-expansion.tsx`: Table with expandable rows
- `row-expansion-state.tsx`: Row expansion with controlled state
- `aside.tsx`: Table with sidebar components
- `aside-state.tsx`: Table with sidebar and controlled state

### Performance Examples

- `virtualization-table.tsx`: Large dataset (10,000+ rows) with virtualization
- `virtualization-table-state.tsx`: Virtualized table with controlled state
- `pagination-loading.tsx`: Table with pagination loading states

### Advanced Data Structures

- `tree-table.tsx`: Hierarchical tree-structured data
- `tree-table-state.tsx`: Tree table with controlled state

**Note**: Examples with `-state.tsx` suffix demonstrate controlled state management patterns.

## State Management

The composition system supports flexible state management approaches:

### 1. Internal State (Default)

Let `DataTableRoot` manage all state internally:

```tsx
<DataTableRoot data={data} columns={columns}>
  <DataTableToolbarSection>
    <DataTableSearchFilter />
    <DataTableViewMenu />
  </DataTableToolbarSection>
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
  <DataTablePagination />
</DataTableRoot>
```

### 2. Controlled State (Parent-Managed)

Control specific state values from parent component:

```tsx
const [globalFilter, setGlobalFilter] = useState("")
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

<DataTableRoot
  data={data}
  columns={columns}
  onGlobalFilterChange={setGlobalFilter}
  onPaginationChange={setPagination}
  initialState={{
    globalFilter,
    pagination,
  }}
>
  <DataTableToolbarSection>
    <DataTableSearchFilter />
  </DataTableToolbarSection>
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
  <DataTablePagination />
</DataTableRoot>
```

### 3. Pre-configured Table Instance

Create your own table instance with full control:

```tsx
import { useReactTable, getCoreRowModel } from "@tanstack/react-table"

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  // ... your custom configuration
})

<DataTableRoot table={table}>
  <DataTableToolbarSection>
    <DataTableSearchFilter />
  </DataTableToolbarSection>
  <DataTable>
    <DataTableHeader />
    <DataTableBody />
  </DataTable>
  <DataTablePagination />
</DataTableRoot>
```

### Server-Side Data Management

For server-side pagination, sorting, and filtering:

```tsx
<DataTableRoot
  data={data}
  columns={columns}
  config={{
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages, // from server
  }}
  onPaginationChange={handlePaginationChange}
  onSortingChange={handleSortingChange}
  onColumnFiltersChange={handleFiltersChange}
>
  {/* ... components */}
</DataTableRoot>
```

### 4. URL State Management (with nuqs)

Persist table state in the URL for shareable links and page refresh persistence.

For a complete working example with all table state persisted in the URL (pagination, sorting, filters, search, column visibility, inline filters), see `examples/advanced-nuqs-state.tsx`.

**Key Benefits:**

- Table state persists on page refresh
- Share links with filters/sorting/pagination applied
- Browser back/forward navigation works
- Better UX for bookmarking specific views

The example demonstrates using nuqs directly with TanStack Table following the official nuqs best practices.

## Quick Start

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableToolbarSection,
  DataTableSearchFilter,
  DataTableViewMenu,
  DataTablePagination,
} from "@/components/data-table"
import { TableColumnHeader } from "@/components/data-table/components"
import type { DataTableColumnDef } from "@/components/data-table/types"

// Define your columns with proper typing
const columns: DataTableColumnDef<Product>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <TableColumnHeader column={column} />,
    enableColumnFilter: true,
    meta: {
      label: "Product Name",
      variant: "text",
      placeholder: "Search products...",
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => <TableColumnHeader column={column} />,
    enableColumnFilter: true,
    meta: {
      label: "Price",
      variant: "number",
      unit: "$",
    },
    cell: ({ row }) => `$${row.getValue("price")}`,
  },
  // ... more columns
]

export function MyDataTable() {
  return (
    <DataTableRoot data={data} columns={columns}>
      <DataTableToolbarSection>
        <DataTableSearchFilter placeholder="Search..." />
        <DataTableViewMenu />
      </DataTableToolbarSection>
      <DataTable>
        <DataTableHeader />
        <DataTableBody />
      </DataTable>
      <DataTablePagination />
    </DataTableRoot>
  )
}
```

### Key Benefits

1. **Flexible State Management**: Choose between internal, controlled, or pre-configured table
2. **Composition-First**: Build exactly what you need with composable components
3. **Auto-Detection**: Features automatically enabled based on component usage
4. **Full Type Safety**: Complete TypeScript support with proper generics
5. **Easy Testing**: Each component can be tested independently
6. **Modern Architecture**: Built on TanStack Table v8 with latest React patterns
7. **Performance Optimized**: Built-in virtualization for large datasets
8. **Loading States**: Integrated skeleton loading and empty states

## Loading States

The DataTable composition system includes built-in loading state support for better UX during data fetching operations.

### Basic Loading Usage

```tsx
import {
  DataTableRoot,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableSkeleton,
  DataTableEmptyBody,
} from "@/components/data-table"

export function MyTable() {
  const [data, setData] = React.useState([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    fetchData()
      .then(setData)
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <DataTableRoot data={data} columns={columns} isLoading={isLoading}>
      <DataTable>
        <DataTableHeader />
        <DataTableBody>
          <DataTableSkeleton rows={5} />
          <DataTableEmptyBody />
        </DataTableBody>
      </DataTable>
    </DataTableRoot>
  )
}
```

### Loading State Features

- **Automatic Skeleton Display**: Shows skeleton rows during loading
- **Customizable Row Count**: Configure the number of skeleton rows via `rows` prop
- **Context Integration**: `isLoading` state available throughout the table via `useDataTable()` hook
- **Smooth Transitions**: Seamless transition between loading and loaded states
- **Server-Side Support**: Works with server-side pagination and filtering

### Accessing Loading State in Custom Components

```tsx
import { useDataTable } from "@/components/data-table"

function CustomComponent() {
  const { isLoading, setIsLoading } = useDataTable()

  const handleRefresh = async () => {
    setIsLoading(true)
    await fetchData()
    setIsLoading(false)
  }

  return (
    <Button onClick={handleRefresh} disabled={isLoading}>
      {isLoading ? "Refreshing..." : "Refresh"}
    </Button>
  )
}
```

### Common Use Cases

1. **Initial Data Loading**: Show skeleton while fetching initial data
2. **Pagination Loading**: Display skeleton when loading new pages
3. **Search/Filter Loading**: Show skeleton during search or filter operations
4. **Refresh Operations**: Indicate data is being refreshed
5. **Optimistic Updates**: Show loading state during mutations

## Benefits of Composition Pattern

1. **Explicit Structure**: The component tree clearly shows what features are enabled - no hidden magic
2. **Easier Testing**: Each component can be tested independently in isolation
3. **Better Performance**: Only render the components you need - no unused feature overhead
4. **Flexible Layouts**: Easy to create custom layouts and arrangements with standard React patterns
5. **Reusable Components**: All components work independently and can be used in different contexts
6. **Full Type Safety**: Complete TypeScript support with proper generics and inference
7. **Auto-Detection**: Smart feature detection based on column config and component usage
8. **Extensible**: Easy to add custom components that integrate with the table context
9. **Modern Patterns**: Built on React best practices and TanStack Table v8
10. **Developer Experience**: Clear API, excellent IDE autocomplete, and helpful error messages

## Best Practices

1. **Always use `TableColumnHeader`** for sortable columns instead of plain strings
2. **Define column meta properties** for consistent filtering and display behavior
3. **Include `DataTableSkeleton` and `DataTableEmptyBody`** in your body for better UX
4. **Use virtualization components** (`DataTableVirtualizedBody`) for datasets over 1,000 rows
5. **Leverage auto-detection** instead of manually configuring feature flags
6. **Use TypeScript** for full type safety and autocomplete support
7. **Wrap toolbar actions** in `DataTableToolbarSection` for consistent spacing
8. **Pass `isLoading` prop** to `DataTableRoot` for integrated loading states

## Troubleshooting

### Sorting not working

- Make sure you're using `<TableColumnHeader column={column} />` instead of plain strings
- Check that `enableSorting` is not set to `false` on the column

### Filtering not showing

- Ensure columns have `enableColumnFilter: true`
- Add `meta.variant` and `meta.label` properties to columns
- Include filter components like `DataTableFilterMenu` in your toolbar

### Pagination not appearing

- Include `<DataTablePagination />` in your component tree
- Check that you have enough data to paginate (more rows than page size)

### Empty state not showing

- Make sure `<DataTableEmptyBody />` is included inside `<DataTableBody>`
- Verify that your data array is actually empty when you expect it to be

### Performance issues with large datasets

- Use virtualization components (`DataTableVirtualizedBody`) for 1,000+ rows
- Increase page size options in `DataTablePagination` for fewer re-renders
- Consider server-side pagination for very large datasets (100,000+ rows)

## API Reference

For detailed API documentation, see:

- **TanStack Table Documentation**: https://tanstack.com/table/latest
- **Column Definition Types**: See `types/index.ts` for `DataTableColumnDef`
- **Filter Variants**: See `lib/constants.ts` for available filter types
- **Hooks**: See `hooks/` directory for custom hooks like `useDataTable`, `useURLState`, etc.

## Contributing

When contributing new components or features:

1. Follow the composition pattern - components should work independently
2. Add proper TypeScript types and JSDoc comments
3. Include examples in the `examples/` directory
4. Update this README with new features and components
5. Test with both small and large datasets
6. Ensure accessibility (keyboard navigation, screen readers)

## License

This component is part of the NikoTable project.
