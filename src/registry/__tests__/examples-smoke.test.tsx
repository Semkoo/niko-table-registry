/**
 * Renders every registry example once and fails on any thrown error or
 * `console.error`. This is the migration net for TanStack Table v9: a feature
 * that isn't registered in `tableFeatures` only fails when the API is actually
 * called, which typechecking can't catch.
 */
import * as React from "react"
import { act, cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

type ExampleModule = { default?: React.ComponentType }

const modules = import.meta.glob<ExampleModule>(
  "../new-york/examples/niko-table/*.tsx",
)

const names = Object.keys(modules)
  .map(path =>
    path
      .split("/")
      .pop()!
      .replace(/\.tsx$/, ""),
  )
  .sort()

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("registry examples", () => {
  it("discovers every example file", () => {
    expect(names.length).toBeGreaterThanOrEqual(60)
  })

  it.each(names)("%s mounts without errors", async name => {
    const errors: unknown[][] = []
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation((...args: unknown[]) => {
        errors.push(args)
      })

    try {
      const path = `../new-york/examples/niko-table/${name}.tsx`
      const mod = await modules[path]!()
      const Component =
        mod.default ??
        (Object.values(mod).find(
          value => typeof value === "function",
        ) as React.ComponentType)

      expect(Component, `${name} has no component export`).toBeTruthy()

      let container: HTMLElement | undefined
      await act(async () => {
        container = render(<Component />).container
      })
      // Let effect-driven work (measurement, virtualizer, async data) settle.
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Every example ships data, so an empty body means a feature/row-model
      // regression rather than a legitimately empty table.
      expect(
        container!.querySelectorAll('[data-slot="table"]').length,
        `${name} rendered no table`,
      ).toBeGreaterThan(0)
      expect(
        container!.querySelectorAll("tbody tr").length,
        `${name} rendered no body rows`,
      ).toBeGreaterThan(0)
      expect(
        container!.querySelectorAll("tbody td").length,
        `${name} rendered no cells`,
      ).toBeGreaterThan(0)
    } finally {
      consoleError.mockRestore()
    }

    const messages = errors.map(args => String(args[0]))
    expect(messages, `console.error during ${name}`).toEqual([])
  })
})
