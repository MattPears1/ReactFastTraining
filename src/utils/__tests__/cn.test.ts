import { describe, it, expect } from "vitest";
import { cn } from "../cn";

describe("cn utility", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", true && "true-class", false && "false-class")).toBe(
      "base true-class",
    );
  });

  it("merges tailwind classes intelligently", () => {
    // Should override conflicting classes
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of classes", () => {
    expect(cn(["px-2", "py-1"], "text-sm")).toBe("px-2 py-1 text-sm");
  });

  it("handles objects with boolean values", () => {
    expect(
      cn({
        "text-sm": true,
        "text-lg": false,
        "font-bold": true,
      }),
    ).toBe("text-sm font-bold");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty strings", () => {
    expect(cn("", "px-2", "")).toBe("px-2");
  });

  it("merges complex tailwind utilities", () => {
    expect(
      cn(
        "hover:bg-red-500 focus:outline-none",
        "hover:bg-blue-500 focus:ring-2",
      ),
    ).toBe("focus:outline-none hover:bg-blue-500 focus:ring-2");
  });

  it("handles arbitrary values correctly", () => {
    expect(cn("w-[100px]", "w-[200px]")).toBe("w-[200px]");
  });

  it("preserves important modifiers", () => {
    expect(cn("!p-4", "p-2")).toBe("!p-4 p-2");
  });

  it("handles responsive modifiers", () => {
    expect(cn("md:px-4 lg:px-6", "md:px-8")).toBe("lg:px-6 md:px-8");
  });

  it("handles multiple arguments of different types", () => {
    expect(
      cn(
        "base",
        ["array1", "array2"],
        { conditional: true, notIncluded: false },
        undefined,
        "final",
      ),
    ).toBe("base array1 array2 conditional final");
  });
});
