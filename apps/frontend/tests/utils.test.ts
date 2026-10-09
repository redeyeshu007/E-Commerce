import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "conditional")).toBe("base");
    expect(cn("base", true && "conditional")).toBe("base conditional");
  });

  it("merges conflicting Tailwind classes correctly", () => {
    // tailwind-merge should keep the last conflicting class
    expect(cn("p-4", "p-8")).toBe("p-8");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("foo", undefined, null, "bar")).toBe("foo bar");
  });
});
