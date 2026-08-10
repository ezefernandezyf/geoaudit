import { load } from "cheerio";

/**
 * Engine-local citability I/O types (design: engine-local types keep engines
 * self-contained and avoid contract-bloat). Cross-engine shapes live in
 * `src/lib/contracts/` — the citability engine maps to `CitabilityResult`
 * there via `toContractResult` (see index.ts).
 */

/**
 * Cheerio does not re-export its node types and `domhandler` is not a direct
 * dependency (pnpm strict layout), so the element type is derived from the
 * `load()` signature instead of a transitive import.
 */
export type AnyNode = Exclude<
  NonNullable<Parameters<typeof load>[0]>,
  string | Buffer | unknown[]
>;

/**
 * One segmented content block (RCI-2 / RCI-13). `heading` is the H2/H3 text
 * ("" for the RCI-13 single-block fallback); `content` is the body text of the
 * block without the heading; `text` is heading + content for display.
 */
export interface ContentBlock {
  id: string;
  heading: string;
  /** 0 = no heading (single-block fallback), 2 = H2, 3 = H3. */
  headingLevel: 0 | 2 | 3;
  content: string;
  text: string;
  paragraphs: string[];
  wordCount: number;
  sentenceCount: number;
  hasTable: boolean;
  hasList: boolean;
  hasQuestionHeading: boolean;
}
