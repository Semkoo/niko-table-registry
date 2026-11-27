import { describe, expect, it } from "vitest"
import { formatStars } from "../github-stars"

describe("formatStars", () => {
  it("abbreviates thousands", () => {
    expect(formatStars(72)).toBe("72")
    expect(formatStars(999)).toBe("999")
    expect(formatStars(1234)).toBe("1.2k")
    expect(formatStars(12000)).toBe("12k")
  })
})
