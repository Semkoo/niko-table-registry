import { describe, expect, it } from "vitest"
import { blockCategories, blocks } from "../blocks"

describe("blocks", () => {
  it("gives every block a category the /blocks/ page shows", () => {
    for (const block of blocks) {
      expect(blockCategories, block.name).toContain(block.category)
    }
  })

  it("has no empty or duplicate names", () => {
    const names = blocks.map(block => block.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
