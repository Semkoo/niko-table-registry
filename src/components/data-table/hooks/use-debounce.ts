import { useEffect, useState } from "react"

/**
 * Debounces a value by delaying updates until after a specified delay period.
 * Useful for search inputs, filter fields, and any rapidly changing values
 * where you want to reduce the number of updates or API calls.
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
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timeout if value changes before delay expires
    // or component unmounts
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
