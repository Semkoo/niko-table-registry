/**
 * CSV encoding rules for table exports.
 *
 * Two obligations pull against each other: a spreadsheet must not evaluate an
 * exported value as a formula, and an exported file must survive being read
 * back in. Blanket-neutralising every leading `-` satisfies the first and
 * breaks the second, because negative amounts are ordinary tabular data.
 */
import { describe, expect, it } from "vitest"

import { escapeCsvValue } from "../../filters/table-export-button"

describe("escapeCsvValue", () => {
  it("neutralises values a spreadsheet would execute", () => {
    expect(escapeCsvValue("=cmd|'/c calc'!A1")).toBe(`'=cmd|'/c calc'!A1`)
    expect(escapeCsvValue("+1+1")).toBe("'+1+1")
    expect(escapeCsvValue("@SUM(A1:A9)")).toBe("'@SUM(A1:A9)")
    expect(escapeCsvValue("\tlead-tab")).toBe("'\tlead-tab")
  })

  it("leaves negative numbers alone so exports round-trip", () => {
    // The reason the `-` carve-out exists: an importer reading `'-5.00` back
    // gets text, not a number, and a whole column of negatives is corrupted.
    expect(escapeCsvValue("-5.00")).toBe("-5.00")
    expect(escapeCsvValue("-0.5")).toBe("-0.5")
    expect(escapeCsvValue(-5)).toBe("-5")
  })

  it("still neutralises a leading `-` that is not a number", () => {
    expect(escapeCsvValue("-2+3+cmd|'/c calc'!A1")).toBe(
      `'-2+3+cmd|'/c calc'!A1`,
    )
    expect(escapeCsvValue("-- comment")).toBe("'-- comment")
  })

  it("quotes separators, quotes and newlines", () => {
    expect(escapeCsvValue("a,b")).toBe('"a,b"')
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvValue("line1\nline2")).toBe('"line1\nline2"')
  })

  it("neutralises the array branch too — quoting is not formula prevention", () => {
    // A spreadsheet evaluates a quoted field that opens with `=`.
    expect(escapeCsvValue(["=1+1", "b"])).toBe(`"'=1+1, b"`)
  })

  it("passes through the ordinary cases untouched", () => {
    expect(escapeCsvValue("Ada Lovelace")).toBe("Ada Lovelace")
    expect(escapeCsvValue(null)).toBe("")
    expect(escapeCsvValue(undefined)).toBe("")
    expect(escapeCsvValue(true)).toBe("true")
  })
})
