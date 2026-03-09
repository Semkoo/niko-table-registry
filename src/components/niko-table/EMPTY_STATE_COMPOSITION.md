# Empty State Composition Pattern

The data table now supports a **composition-based API** for empty states, giving you maximum flexibility while maintaining the copy-paste philosophy.

---

## 🎯 Why Composition?

**The Pattern**:

```tsx
<DataTableEmptyBody>
  <DataTableEmptyIcon>
    <PackageOpen className="size-12" />
  </DataTableEmptyIcon>
  <DataTableEmptyMessage>
    <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
    <DataTableEmptyDescription>
      Get started by adding your first product
    </DataTableEmptyDescription>
  </DataTableEmptyMessage>
  <DataTableEmptyFilteredMessage>
    No matches found
  </DataTableEmptyFilteredMessage>
  <DataTableEmptyActions>
    <Button onClick={handleAdd}>Add Product</Button>
  </DataTableEmptyActions>
</DataTableEmptyBody>
```

**Benefits**:

- ✅ More flexible and composable
- ✅ Cleaner code structure
- ✅ Follows shadcn/ui philosophy
- ✅ Better TypeScript inference
- ✅ Easier to customize
- ✅ Cleaner API without prop overload

---

## 📦 Available Components

### Core Components

#### `DataTableEmptyIcon`

Displays an icon above the empty message.

```tsx
<DataTableEmptyIcon>
  <PackageOpen className="size-12" />
</DataTableEmptyIcon>
```

#### `DataTableEmptyMessage`

Message shown when table is truly empty (no filters active).

```tsx
<DataTableEmptyMessage>
  <p className="font-semibold">No data found</p>
  <p className="text-sm text-muted-foreground">Try adding some items</p>
</DataTableEmptyMessage>
```

#### `DataTableEmptyFilteredMessage`

Message shown when filters are active but no results match.

```tsx
<DataTableEmptyFilteredMessage>
  No matches found for your search
</DataTableEmptyFilteredMessage>
```

#### `DataTableEmptyActions`

Container for action buttons (Add, Clear Filters, etc.).

```tsx
<DataTableEmptyActions>
  <Button onClick={handleAdd}>Add Item</Button>
  <Button variant="outline" onClick={handleClear}>
    Clear Filters
  </Button>
</DataTableEmptyActions>
```

### Convenience Components

#### `DataTableEmptyTitle`

Consistent styling for titles.

```tsx
<DataTableEmptyTitle>No products found</DataTableEmptyTitle>
```

#### `DataTableEmptyDescription`

Consistent styling for descriptions.

```tsx
<DataTableEmptyDescription>
  Get started by adding your first product
</DataTableEmptyDescription>
```

---

## 🎨 Usage Examples

### Basic Example

```tsx
import { DataTableBody } from "@/components/niko-table/core/data-table-structure"
import {
  DataTableEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { PackageOpen } from "lucide-react"

<DataTableBody>
  <DataTableEmptyBody>
    <DataTableEmptyIcon>
      <PackageOpen className="size-12" />
    </DataTableEmptyIcon>
    <DataTableEmptyMessage>
      <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
      <DataTableEmptyDescription>
        Your product list is empty
      </DataTableEmptyDescription>
    </DataTableEmptyMessage>
  </DataTableEmptyBody>
</DataTableBody>
```

### With Filtered State

```tsx
<DataTableBody>
  <DataTableEmptyBody>
    <DataTableEmptyIcon>
      <PackageOpen className="size-12" />
    </DataTableEmptyIcon>

    {/* Shown when NOT filtered */}
    <DataTableEmptyMessage>
      <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
      <DataTableEmptyDescription>
        Get started by adding your first product
      </DataTableEmptyDescription>
    </DataTableEmptyMessage>

    {/* Shown when FILTERED */}
    <DataTableEmptyFilteredMessage>
      <p className="font-semibold">No matches found</p>
      <p className="text-sm text-muted-foreground">
        Try adjusting your filters
      </p>
    </DataTableEmptyFilteredMessage>
  </DataTableEmptyBody>
</DataTableBody>
```

### With Actions

```tsx
import { Button } from "@/components/ui/button"

<DataTableBody>
  <DataTableEmptyBody>
    <DataTableEmptyIcon>
      <PackageOpen className="size-12" />
    </DataTableEmptyIcon>
    <DataTableEmptyMessage>
      <DataTableEmptyTitle>No products yet</DataTableEmptyTitle>
      <DataTableEmptyDescription>
        Create your first product to get started
      </DataTableEmptyDescription>
    </DataTableEmptyMessage>
    <DataTableEmptyActions>
      <Button onClick={handleAddProduct}>Add Product</Button>
    </DataTableEmptyActions>
  </DataTableEmptyBody>
</DataTableBody>
```

### Complete Example with All Features

```tsx
import { DataTableBody } from "@/components/niko-table/core/data-table-structure"
import {
  DataTableEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyActions,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { PackageOpen, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

function ProductTable() {
  const handleAddProduct = () => {
    // Add product logic
  }

  const handleClearFilters = () => {
    // Clear filters logic
  }

  return (
    <DataTableBody>
      <DataTableEmptyBody>
        {/* Icon (shown for both empty and filtered states) */}
        <DataTableEmptyIcon>
          <PackageOpen className="size-12" />
        </DataTableEmptyIcon>

        {/* Empty state (no filters) */}
        <DataTableEmptyMessage>
          <DataTableEmptyTitle>No products found</DataTableEmptyTitle>
          <DataTableEmptyDescription>
            Get started by creating your first product. You can add details,
            pricing, and inventory information.
          </DataTableEmptyDescription>
        </DataTableEmptyMessage>

        {/* Filtered state (filters active) */}
        <DataTableEmptyFilteredMessage>
          <DataTableEmptyTitle>No matches found</DataTableEmptyTitle>
          <DataTableEmptyDescription>
            Try adjusting your search or filter criteria
          </DataTableEmptyDescription>
        </DataTableEmptyFilteredMessage>

        {/* Actions */}
        <DataTableEmptyActions>
          <Button onClick={handleAddProduct}>Add Product</Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </DataTableEmptyActions>
      </DataTableEmptyBody>
    </DataTableBody>
  )
}
```

### Virtualized Tables

Works exactly the same with `DataTableVirtualizedEmptyBody`:

```tsx
import {
  DataTableVirtualizedBody,
  DataTableVirtualizedEmptyBody,
} from "@/components/niko-table/core/data-table-virtualized-structure"
import {
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
import { Database } from "lucide-react"

<DataTableVirtualizedBody height={600}>
  <DataTableVirtualizedEmptyBody>
    <DataTableEmptyIcon>
      <Database className="size-12" />
    </DataTableEmptyIcon>
    <DataTableEmptyMessage>
      <DataTableEmptyTitle>No logs found</DataTableEmptyTitle>
      <DataTableEmptyDescription>
        Logs will appear here as they are generated
      </DataTableEmptyDescription>
    </DataTableEmptyMessage>
  </DataTableVirtualizedEmptyBody>
</DataTableVirtualizedBody>
```

### Custom Styling

All components accept `className` for custom styling:

```tsx
<DataTableEmptyBody>
  <DataTableEmptyIcon className="text-blue-500">
    <PackageOpen className="size-16" />
  </DataTableEmptyIcon>
  <DataTableEmptyMessage className="max-w-md">
    <DataTableEmptyTitle className="text-2xl">
      Welcome to Your Store
    </DataTableEmptyTitle>
    <DataTableEmptyDescription className="text-base">
      Let's get you started with your first product
    </DataTableEmptyDescription>
  </DataTableEmptyMessage>
  <DataTableEmptyActions className="gap-4">
    <Button size="lg">Get Started</Button>
  </DataTableEmptyActions>
</DataTableEmptyBody>
```

### Different Icons for Different States

```tsx
import { PackageOpen, SearchX } from "lucide-react"

<DataTableBody>
  <DataTableEmptyBody>
    {/* You can conditionally render different icons */}
    <DataTableEmptyIcon>
      {isFiltered ? (
        <SearchX className="size-12" />
      ) : (
        <PackageOpen className="size-12" />
      )}
    </DataTableEmptyIcon>

    <DataTableEmptyMessage>
      <DataTableEmptyTitle>No products</DataTableEmptyTitle>
    </DataTableEmptyMessage>

    <DataTableEmptyFilteredMessage>
      <DataTableEmptyTitle>No matches</DataTableEmptyTitle>
    </DataTableEmptyFilteredMessage>
  </DataTableEmptyBody>
</DataTableBody>

// Or use the context to determine state:
import { useDataTable } from "@/components/niko-table/core/data-table-context"

function CustomEmptyState() {
  const { table } = useDataTable()
  const isFiltered =
    table.getState().globalFilter || table.getState().columnFilters.length > 0

  return (
    <DataTableEmptyBody>
      <DataTableEmptyIcon>
        {isFiltered ? <SearchX /> : <PackageOpen />}
      </DataTableEmptyIcon>
      {/* ... */}
    </DataTableEmptyBody>
  )
}
```

---

## 🎨 Styling & Customization

### Default Styles

```tsx
// Icon - 48px (size-12), muted
<DataTableEmptyIcon>
  <PackageOpen className="size-12" /> {/* default */}
</DataTableEmptyIcon>

// Title - semibold
<DataTableEmptyTitle>Title</DataTableEmptyTitle>

// Description - small, muted
<DataTableEmptyDescription>Description</DataTableEmptyDescription>

// Actions - horizontal flex with gap
<DataTableEmptyActions>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</DataTableEmptyActions>
```

### Custom Styles

```tsx
<DataTableEmptyBody>
  {/* Larger icon with color */}
  <DataTableEmptyIcon className="text-primary">
    <PackageOpen className="size-20" />
  </DataTableEmptyIcon>

  {/* Custom title size */}
  <DataTableEmptyMessage className="max-w-lg">
    <DataTableEmptyTitle className="text-3xl text-primary">
      Your Store Awaits
    </DataTableEmptyTitle>
    <DataTableEmptyDescription className="mt-2 text-base">
      Create amazing products and start selling today
    </DataTableEmptyDescription>
  </DataTableEmptyMessage>

  {/* Vertical actions */}
  <DataTableEmptyActions className="flex-col">
    <Button size="lg" className="w-full">
      Primary Action
    </Button>
    <Button size="lg" variant="outline" className="w-full">
      Secondary Action
    </Button>
  </DataTableEmptyActions>
</DataTableEmptyBody>
```

---

## 🧩 Component Hierarchy

```plaintext
DataTableBody / DataTableVirtualizedBody
└── DataTableEmptyBody / DataTableVirtualizedEmptyBody
    └── [Composition Mode]
        ├── DataTableEmptyIcon (optional)
        │   └── Your Icon Component
        ├── DataTableEmptyMessage (shown when NOT filtered)
        │   ├── DataTableEmptyTitle (convenience)
        │   ├── DataTableEmptyDescription (convenience)
        │   └── Custom content
        ├── DataTableEmptyFilteredMessage (shown when filtered)
        │   ├── DataTableEmptyTitle (convenience)
        │   ├── DataTableEmptyDescription (convenience)
        │   └── Custom content
        └── DataTableEmptyActions (optional)
            └── Your action buttons
```

---

## 📝 TypeScript Support

All components are fully typed:

```tsx
import type {
  DataTableEmptyIconProps,
  DataTableEmptyMessageProps,
  DataTableEmptyFilteredMessageProps,
  DataTableEmptyActionsProps,
  DataTableEmptyTitleProps,
  DataTableEmptyDescriptionProps,
} from "@/components/niko-table/components/data-table-empty-state"

// All accept children and className
interface DataTableEmptyIconProps {
  children: React.ReactNode
  className?: string
}
```

---

## ✅ Best Practices

### 1. Use Semantic Structure

```tsx
✅ Good
<DataTableEmptyMessage>
  <DataTableEmptyTitle>Main message</DataTableEmptyTitle>
  <DataTableEmptyDescription>Details</DataTableEmptyDescription>
</DataTableEmptyMessage>

❌ Avoid
<DataTableEmptyMessage>
  <span>Main message</span>
  <span>Details</span>
</DataTableEmptyMessage>
```

### 2. Provide Both Empty and Filtered Messages

```tsx
✅ Good - User knows why table is empty
<DataTableEmptyBody>
  <DataTableEmptyMessage>No items in database</DataTableEmptyMessage>
  <DataTableEmptyFilteredMessage>No matches</DataTableEmptyFilteredMessage>
</DataTableEmptyBody>

❌ Missing context - User confused
<DataTableEmptyBody>
  <DataTableEmptyMessage>No data</DataTableEmptyMessage>
</DataTableEmptyBody>
```

### 3. Icon Size

```tsx
✅ Good - Visible but not overwhelming
<PackageOpen className="size-12" />

❌ Too small
<PackageOpen className="size-4" />

❌ Too large
<PackageOpen className="size-32" />
```

### 4. Action Clarity

```tsx
✅ Clear action
<Button onClick={handleAdd}>Add Product</Button>

❌ Vague action
<Button onClick={handleAdd}>Click Here</Button>
```

---

## 🚀 Quick Start Guide

### Step 1: Imports

All components are included in the data-table package:

```tsx
import { DataTableBody } from "@/components/niko-table/core/data-table-structure"
import {
  DataTableEmptyBody,
  DataTableEmptyIcon,
  DataTableEmptyMessage,
  DataTableEmptyFilteredMessage,
  DataTableEmptyActions,
  DataTableEmptyTitle,
  DataTableEmptyDescription,
} from "@/components/niko-table/components/data-table-empty-state"
```

### Step 2: Build Your Empty State

Use composition to build your custom empty state:

```tsx
<DataTableEmptyBody>
  <DataTableEmptyIcon>
    <PackageOpen className="size-12" />
  </DataTableEmptyIcon>
  <DataTableEmptyMessage>
    <DataTableEmptyTitle>No products</DataTableEmptyTitle>
    <DataTableEmptyDescription>
      Start by adding your first product
    </DataTableEmptyDescription>
  </DataTableEmptyMessage>
  <DataTableEmptyFilteredMessage>
    No matches found for your search
  </DataTableEmptyFilteredMessage>
  <DataTableEmptyActions>
    <Button onClick={handleAdd}>Add Product</Button>
  </DataTableEmptyActions>
</DataTableEmptyBody>
```

### Step 3: Customize

Each component accepts `className` for full customization:

```tsx
<DataTableEmptyIcon className="text-orange-500">
  <PackageOpen className="size-16" />
</DataTableEmptyIcon>
```

---

## 🎯 Summary

The composition pattern gives you:

- ✅ **More control** - Fine-grained customization
- ✅ **Better DX** - Cleaner, more readable code
- ✅ **Flexibility** - Mix and match as needed
- ✅ **Type safety** - Full TypeScript support
- ✅ **Simple API** - Clean, prop-free design

**Perfect for fresh projects!** 🚀

---

**Last Updated**: November 10, 2025  
**Pattern**: Composition over Configuration  
**Philosophy**: Copy-paste friendly, shadcn/ui style
