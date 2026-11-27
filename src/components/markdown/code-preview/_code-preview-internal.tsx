import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeIcon, EyeIcon, Loader2Icon } from "lucide-react"

export type Demo =
  | "niko-table/simple"
  | "niko-table/basic"
  | "niko-table/search"
  | "niko-table/advanced"
  | "niko-table/all-features-table"
  | "niko-table/row-selection"
  | "niko-table/row-selection-state"
  | "niko-table/row-expansion"
  | "niko-table/row-expansion-state"
  | "niko-table/tree-table"
  | "niko-table/tree-table-state"
  | "niko-table/virtualization-table"
  | "niko-table/virtualization-table-state"
  | "niko-table/faceted"
  | "niko-table/faceted-state"
  | "niko-table/aside"
  | "niko-table/aside-state"
  | "niko-table/advanced-state"
  | "niko-table/advanced-inline"
  | "niko-table/advanced-inline-state"
  | "niko-table/advanced-nuqs-state"
  | "niko-table/server-side-state"
  | "niko-table/server-side-nuqs-state"
  | "niko-table/drizzle-state"
  | "niko-table/drizzle-nuqs-state"
  | "niko-table/basic-state"
  | "niko-table/search-state"
  | "niko-table/row-dnd"
  | "niko-table/row-dnd-state"
  | "niko-table/column-dnd"
  | "niko-table/column-dnd-state"
  | "niko-table/column-pinning"
  | "niko-table/column-pinning-state"
  | "niko-table/grouping"
  | "niko-table/grouping-state"
  | "niko-table/column-resize"
  | "niko-table/column-resize-state"
  | "niko-table/column-resize-autofit"
  | "niko-table/column-resize-persisted"
  | "niko-table/virtualized-row-dnd"
  | "niko-table/virtualized-column-dnd"
  | "niko-table/row-context-menu"
  | "niko-table/inline-edit"
  | "niko-table/inline-edit-state"
  | "niko-table/grid-all-features"
  | "niko-table/grid-basic"
  | "niko-table/grid-basic-state"
  | "niko-table/grid-cell-types"
  | "niko-table/grid-cell-types-state"
  | "niko-table/grid-dynamic-columns"
  | "niko-table/grid-dynamic-columns-state"
  | "niko-table/grid-save"
  | "niko-table/grid-save-state"
  | "niko-table/grid-server-side-state"
  | "niko-table/grid-validation"
  | "niko-table/grid-validation-state"
  | "niko-table/grid-portaled-cell"
  | "niko-table/infinite-scroll-table"
  | "niko-table/infinite-scroll-table-state"
  | "niko-table/infinite-scroll-virtualized-table"
  | "niko-table/infinite-scroll-virtualized-table-state"

type Tab = "preview" | "code"

/**
 * Tab chrome only. The highlighted `<Code>` block is SSR’d as a sibling in
 * `code-preview.astro` (outside this island) so Expressive Code’s stylesheet
 * is emitted onto the page — client-island slots strip that CSS link.
 */
export function CodePreviewTabBar() {
  const [tab, setTab] = useState<Tab>("preview")
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    rootRef.current
      ?.closest("[data-code-preview]")
      ?.setAttribute("data-state", tab)
  }, [tab])

  return (
    <div ref={rootRef}>
      <Tabs
        value={tab}
        onValueChange={value => setTab(value as Tab)}
        className="gap-0"
      >
        <TabsList>
          <TabsTrigger value="preview" className="px-3">
            <EyeIcon aria-hidden="true" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code" className="px-3">
            <CodeIcon aria-hidden="true" />
            Code
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}

export function CodePreviewDemo({ demo }: { demo: Demo }) {
  const [componentName, demoName] = demo.split("/")
  const Component = getComponent(componentName, demoName)

  return (
    <Suspense fallback={<Loader2Icon className="size-16 animate-spin" />}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Component />
    </Suspense>
  )
}

function getComponent(component: string, demo: string) {
  return lazy(async () => {
    const module = await import(
      `../../../registry/new-york/examples/${component}/${demo}.tsx`
    )
    const namedExport = Object.keys(module).find(
      key => typeof module[key] === "function",
    )
    return {
      default:
        module.default ?? (namedExport ? module[namedExport] : undefined),
    }
  })
}
