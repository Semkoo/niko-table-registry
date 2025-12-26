import { lazy, Suspense, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2Icon } from "lucide-react"
import { OpenInV0Button } from "@/components/open-in-v0-button"
import { SERVER_URL } from "@/data/env"

export type Demo =
  | "niko-data-table/simple"
  | "niko-data-table/basic"
  | "niko-data-table/search"
  | "niko-data-table/filter"
  | "niko-data-table/advanced"
  | "niko-data-table/all-features-table"
  | "niko-data-table/row-selection"
  | "niko-data-table/row-selection-state"
  | "niko-data-table/row-expansion"
  | "niko-data-table/row-expansion-state"
  | "niko-data-table/tree-table"
  | "niko-data-table/tree-table-state"
  | "niko-data-table/virtualization-table"
  | "niko-data-table/virtualization-table-state"
  | "niko-data-table/faceted"
  | "niko-data-table/faceted-state"
  | "niko-data-table/aside"
  | "niko-data-table/aside-state"
  | "niko-data-table/advanced-state"
  | "niko-data-table/advanced-inline"
  | "niko-data-table/advanced-inline-state"
  | "niko-data-table/advanced-nuqs-state"
  | "niko-data-table/server-side-state"
  | "niko-data-table/server-side-nuqs-state"
  | "niko-data-table/basic-state"
  | "niko-data-table/search-state"
  | "niko-data-table/pagination-loading"

export function CodePreviewInternal({
  demo,
  children,
}: {
  demo: Demo
  children: ReactNode
}) {
  const componentName = demo.split("/")[0]
  const Component = getComponent(componentName, demo.split("/")[1])

  return (
    <Tabs defaultValue="preview" className="not-content">
      <TabsList className="w-full">
        <TabsTrigger value="preview" className="grow-0">
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="grow-0">
          Code
        </TabsTrigger>
        <OpenInV0Button
          url={`${SERVER_URL}/r/${componentName}.json`}
          className="ml-auto"
        />
      </TabsList>
      <Card className="no-scrollbar min-h-[450px] overflow-y-auto rounded-lg bg-transparent p-0">
        <CardContent className="h-full p-0">
          <TabsContent
            value="preview"
            className="flex h-full items-center justify-center p-4"
          >
            <Suspense
              fallback={<Loader2Icon className="size-16 animate-spin" />}
            >
              {/* eslint-disable-next-line react-hooks/static-components */}
              <Component />
            </Suspense>
          </TabsContent>
          <TabsContent value="code" className="h-full">
            {children}
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
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
