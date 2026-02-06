import { lazy, Suspense, type ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2Icon } from "lucide-react"
import { OpenInV0Button } from "@/components/open-in-v0-button"
import { SERVER_URL } from "@/data/env"

export type Demo =
  | "niko-tables/simple"
  | "niko-tables/basic"
  | "niko-tables/search"
  | "niko-tables/filter"
  | "niko-tables/advanced"
  | "niko-tables/all-features-table"
  | "niko-tables/row-selection"
  | "niko-tables/row-selection-state"
  | "niko-tables/row-expansion"
  | "niko-tables/row-expansion-state"
  | "niko-tables/tree-table"
  | "niko-tables/tree-table-state"
  | "niko-tables/virtualization-table"
  | "niko-tables/virtualization-table-state"
  | "niko-tables/faceted"
  | "niko-tables/faceted-state"
  | "niko-tables/aside"
  | "niko-tables/aside-state"
  | "niko-tables/advanced-state"
  | "niko-tables/advanced-inline"
  | "niko-tables/advanced-inline-state"
  | "niko-tables/advanced-nuqs-state"
  | "niko-tables/server-side-state"
  | "niko-tables/server-side-nuqs-state"
  | "niko-tables/basic-state"
  | "niko-tables/search-state"
  | "niko-tables/pagination-loading"

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
