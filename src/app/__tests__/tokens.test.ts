import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * U1.T2 — Tailwind 4 @theme tokens (DNF-2).
 * jsdom cannot compile Tailwind, so the "class test" verifies the source of
 * truth: every token declared under `@theme` in globals.css generates a
 * compile-time utility class (e.g. `--color-navy` → `bg-navy`/`text-navy`).
 */
const css = readFileSync("src/app/globals.css", "utf8");

function themeBlock(source: string): string {
  const match = source.match(/@theme\s*{([\s\S]*?)}/);
  if (!match) throw new Error("No @theme block found in globals.css");
  return match[1];
}

const theme = themeBlock(css);

describe("design tokens (DNF-2)", () => {
  it("declares an @theme block in globals.css", () => {
    expect(theme).toBeTruthy();
  });

  it("defines the brand palette as --color-* tokens (→ bg-navy, text-emerald, …)", () => {
    expect(theme).toMatch(/--color-navy:\s*#0f172a/);
    expect(theme).toMatch(/--color-emerald:\s*#10b981/);
    expect(theme).toMatch(/--color-amber:\s*#f59e0b/);
    expect(theme).toMatch(/--color-red:\s*#ef4444/);
  });

  it("defines semantic surface/text/border tokens", () => {
    expect(theme).toMatch(/--color-surface:/);
    expect(theme).toMatch(/--color-surface-muted:/);
    expect(theme).toMatch(/--color-text-primary:/);
    expect(theme).toMatch(/--color-text-secondary:/);
    expect(theme).toMatch(/--color-border:/);
    expect(theme).toMatch(/--color-border-strong:/);
  });

  it("maps --font-* tokens to the next/font variables from the root layout", () => {
    expect(theme).toMatch(/--font-sans:\s*var\(--font-work-sans\)/);
    expect(theme).toMatch(/--font-display:\s*var\(--font-instrument-serif\)/);
    expect(theme).toMatch(/--font-mono:\s*var\(--font-jetbrains-mono\)/);
  });

  it("exposes a spacing scale (--spacing-* tokens) on the 4px grid", () => {
    expect(theme).toMatch(/--spacing-4:\s*1rem/);
    expect(theme).toMatch(/--spacing-6:\s*1\.5rem/);
  });

  it("keeps the utilities referenced by the primitives generatable", () => {
    // Tailwind v4 maps --color-X → bg-X/text-X/border-X and --font-X → font-X.
    // A class like `bg-navy` only compiles if `--color-navy` is declared.
    const utilityToToken: Array<[string, RegExp]> = [
      ["bg-navy", /--color-navy:/],
      ["text-emerald", /--color-emerald:/],
      ["bg-surface", /--color-surface:/],
      ["text-text-primary", /--color-text-primary:/],
      ["border-border", /--color-border:/],
      ["font-display", /--font-display:/],
      ["font-mono", /--font-mono:/],
    ];
    for (const [util, tokenPattern] of utilityToToken) {
      expect(css, `${util} requires ${tokenPattern.source} in @theme`).toMatch(
        tokenPattern,
      );
    }
  });
});
