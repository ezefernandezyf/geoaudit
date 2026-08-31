import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Intercepts every `.css` import so it never reaches vite:css (which would
 * load PostCSS/Tailwind — jsdom can't apply styles anyway). Token coverage
 * is done by reading globals.css directly in tokens.test.ts.
 *
 * Note: typed structurally (not as vite `Plugin`) because `vite` is a
 * transitive dependency — under pnpm's strict node_modules it is not
 * resolvable from this project root.
 */
const cssStub = () => ({
  name: "relevy:css-stub",
  enforce: "pre" as const,
  resolveId(id: string) {
    if (id.endsWith(".css")) {
      // Null-byte prefix = virtual module; no `.css` suffix so vite:css
      // (and its PostCSS config loading) never processes it.
      const bare = id.replace(/\.css$/, "");
      return { id: `\0virtual:css:${bare}`, moduleSideEffects: false };
    }
    return null;
  },
  load(id: string) {
    if (id.startsWith("\0virtual:css:")) return "export default {}";
    return null;
  },
});

/**
 * Vitest 4 configuration for Relevy.
 * jsdom environment + globals (RTL auto-cleanup), jest-dom matchers via setup,
 * v8 coverage, and the `@/*` alias shared with tsconfig.
 */
export default defineConfig({
  plugins: [react(), cssStub()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "coverage",
    },
  },
});
