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

import { useEffect, useState } from "react"

/**
 * Debounces a value by delaying updates until after a specified delay period.
 *
 * @template T - The type of the value to debounce
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds before updating the debounced value (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * // Basic usage with search input
 * function SearchFilter() {
 *   const [search, setSearch] = useState("")
 *   const debouncedSearch = useDebounce(search, 500)
 *
 *   useEffect(() => {
 *     // This only runs after user stops typing for 500ms
 *     console.log("Searching for:", debouncedSearch)
 *   }, [debouncedSearch])
 *
 *   return (
 *     <input
 *       value={search}
 *       onChange={(e) => setSearch(e.target.value)}
 *       placeholder="Search..."
 *     />
 *   )
 * }
 *
 * @example
 * // With API calls
 * function ProductSearch() {
 *   const [query, setQuery] = useState("")
 *   const debouncedQuery = useDebounce(query, 300)
 *
 *   useEffect(() => {
 *     if (debouncedQuery) {
 *       // API call only happens after 300ms of no typing
 *       fetchProducts(debouncedQuery).then(setProducts)
 *     }
 *   }, [debouncedQuery])
 *
 *   return <input value={query} onChange={(e) => setQuery(e.target.value)} />
 * }
 *
 * @example
 * // With table filtering
 * function DataTableWithDebounce() {
 *   const [filterValue, setFilterValue] = useState("")
 *   const debouncedFilter = useDebounce(filterValue, 400)
 *
 *   return (
 *     <DataTableRoot
 *       data={data}
 *       columns={columns}
 *       onGlobalFilterChange={debouncedFilter}
 *     >
 *       <DataTableToolbarSection>
 *         <input
 *           value={filterValue}
 *           onChange={(e) => setFilterValue(e.target.value)}
 *         />
 *       </DataTableToolbarSection>
 *       <DataTable>
 *         <DataTableHeader />
 *         <DataTableBody />
 *       </DataTable>
 *     </DataTableRoot>
 *   )
 * }
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
