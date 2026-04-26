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
  Children,
  isValidElement,
  type ReactNode,
  type ComponentType,
  type PropsWithChildren,
} from "react"

/**
 * Feature requirements that components can declare
 */
export interface FeatureRequirements {
  enableFilters?: boolean
  enablePagination?: boolean
  enableRowSelection?: boolean
  enableSorting?: boolean
  enableMultiSort?: boolean
  enableGrouping?: boolean
  enableExpanding?: boolean
  manualSorting?: boolean
  manualPagination?: boolean
  manualFiltering?: boolean
  pageCount?: number
}

// Tree-walk detection is 50-150ms; cache by `children` identity. Client-only
// (SSR cache would mismatch) and skipped when `columns` provided (changes too
// often). Map (not WeakMap) since ReactNode can be primitive.
const detectionCache =
  typeof window !== "undefined" ? new Map<unknown, FeatureRequirements>() : null

// LRU cap so long-running apps don't leak.
const MAX_CACHE_SIZE = 50

/**
 * Component feature registry - maps component displayNames to their requirements
 */
const COMPONENT_FEATURES: Record<string, FeatureRequirements> = {
  // Pagination components
  DataTablePagination: { enablePagination: true },
  TablePagination: { enablePagination: true },

  // Filtering components
  DataTableViewMenu: { enableFilters: true },
  TableViewMenu: { enableFilters: true },
  DataTableSearchFilter: { enableFilters: true },
  TableSearchFilter: { enableFilters: true },
  DataTableFacetedFilter: { enableFilters: true },
  TableFacetedFilter: { enableFilters: true },
  DataTableSliderFilter: { enableFilters: true },
  TableSliderFilter: { enableFilters: true },

  // Advanced filtering & sorting components
  DataTableSortMenu: { enableSorting: true },
  TableSortMenu: { enableSorting: true },
  DataTableFilterMenu: { enableFilters: true },
  TableFilterMenu: { enableFilters: true },

  DataTableDateFilter: { enableFilters: true },
  DataTableInlineFilter: { enableFilters: true },
  TableInlineFilter: { enableFilters: true },
  DataTableClearFilter: { enableFilters: true },
  TableClearFilter: { enableFilters: true },

  // Column-level filter menu components
  DataTableColumnFacetedFilterMenu: { enableFilters: true },
  TableColumnFacetedFilterMenu: { enableFilters: true },
  DataTableColumnFacetedFilterOptions: { enableFilters: true },
  TableColumnFacetedFilterOptions: { enableFilters: true },
  DataTableColumnSliderFilterMenu: { enableFilters: true },
  TableColumnSliderFilterMenu: { enableFilters: true },
  DataTableColumnSliderFilterOptions: { enableFilters: true },
  TableColumnSliderFilterOptions: { enableFilters: true },
  DataTableColumnDateFilterMenu: { enableFilters: true },
  TableColumnDateFilterMenu: { enableFilters: true },
  DataTableColumnDateFilterOptions: { enableFilters: true },
  TableColumnDateFilterOptions: { enableFilters: true },

  // Selection components
  DataTableSelectionBar: { enableRowSelection: true },

  // Sorting components (most components support sorting by default)
  DataTableColumnHeader: { enableSorting: true },
  TableColumnHeader: { enableSorting: true },
  TableColumnSortMenu: { enableSorting: true, enableMultiSort: true },
  DataTableColumnSortMenu: { enableSorting: true, enableMultiSort: true },
  TableColumnSortOptions: { enableSorting: true, enableMultiSort: true },
  DataTableColumnSortOptions: { enableSorting: true, enableMultiSort: true },
}

/**
 * Walks the React tree to aggregate feature requirements declared by child
 * components (via displayName) and column header functions.
 */
export function detectFeaturesFromChildren(
  children: ReactNode,
  columns?: Array<{ header?: unknown; enableColumnFilter?: boolean }>,
): FeatureRequirements {
  // Skip cache when `columns` provided — column content drives detection and
  // changes frequently, would return stale results.
  const shouldCache =
    detectionCache && !columns && children && typeof children === "object"

  if (shouldCache) {
    const cached = detectionCache.get(children)
    if (cached) {
      return cached
    }
  }

  const requirements: FeatureRequirements = {}

  const searchRecursively = (children: ReactNode) => {
    const childrenArray = Children.toArray(children)

    for (const child of childrenArray) {
      if (isValidElement(child)) {
        // Check if this component has feature requirements
        if (typeof child.type === "function") {
          const componentType = child.type as ComponentType<unknown> & {
            displayName?: string
          }
          const displayName = componentType.displayName
          const componentFeatures = displayName
            ? COMPONENT_FEATURES[displayName]
            : undefined

          if (componentFeatures) {
            // Merge requirements (any component requiring a feature enables it)
            Object.keys(componentFeatures).forEach(key => {
              const featureKey = key as keyof FeatureRequirements
              if (componentFeatures[featureKey]) {
                ;(requirements as Record<string, unknown>)[featureKey] = true
              }
            })
          }
        }

        // Recursively check nested children
        const propsWithChildren = child.props as PropsWithChildren<unknown>
        if (propsWithChildren?.children) {
          searchRecursively(propsWithChildren.children)
        }
      }
    }
  }

  // Check columns for header components (like TableColumnHeader, TableColumnSortMenu)
  if (columns && Array.isArray(columns)) {
    for (const column of columns) {
      // Check if column has enableColumnFilter set
      if (column.enableColumnFilter) {
        requirements.enableFilters = true
      }

      if (column.header && typeof column.header === "function") {
        try {
          // Try to call the header function with mock context to get the rendered component
          // Using unknown for the context type since we're creating a minimal mock
          const headerFn = column.header as (context: {
            column: Record<string, unknown>
          }) => ReactNode
          const headerResult = headerFn({
            column: {
              getCanSort: () => true,
              getIsSorted: () => false,
              toggleSorting: () => {},
              clearSorting: () => {},
              getCanHide: () => true,
              getIsVisible: () => true,
              toggleVisibility: () => {},
              getCanPin: () => true,
              getIsPinned: () => false,
              pin: () => {},
              columnDef: { meta: {} },
              id: "mock",
            },
          })

          // Recursively check the header result and all its children for feature components
          const checkElementForFeatures = (element: ReactNode) => {
            if (!isValidElement(element)) return

            if (typeof element.type === "function") {
              const componentType = element.type as ComponentType<unknown> & {
                displayName?: string
              }
              const displayName = componentType.displayName
              const componentFeatures = displayName
                ? COMPONENT_FEATURES[displayName]
                : undefined

              if (componentFeatures) {
                Object.keys(componentFeatures).forEach(key => {
                  const featureKey = key as keyof FeatureRequirements
                  if (componentFeatures[featureKey]) {
                    ;(requirements as Record<string, unknown>)[featureKey] =
                      true
                  }
                })
              }
            }

            // Recursively check children
            const propsWithChildren =
              element.props as PropsWithChildren<unknown>
            if (propsWithChildren?.children) {
              Children.toArray(propsWithChildren.children).forEach(
                checkElementForFeatures,
              )
            }
          }

          checkElementForFeatures(headerResult)
        } catch {
          // Ignore errors from calling header function
        }
      }
    }
  }

  searchRecursively(children)

  // Cache the result only when caching is appropriate (no columns provided)
  if (shouldCache && detectionCache) {
    // Limit cache size to prevent memory leaks
    if (detectionCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry (first in the map)
      const firstKey = detectionCache.keys().next().value
      if (firstKey !== undefined) {
        detectionCache.delete(firstKey)
      }
    }

    detectionCache.set(children, requirements)
  }

  return requirements
}
/**
 * Register a component's feature requirements
 * This allows third-party components to declare their needs
 */
export function registerComponentFeatures(
  displayName: string,
  features: FeatureRequirements,
) {
  COMPONENT_FEATURES[displayName] = features
}

/**
 * Get all registered components and their features (for debugging)
 */
export function getRegisteredComponents() {
  return { ...COMPONENT_FEATURES }
}
