/**
 * Platform rows (U5.4, APT-8, design `presenters/platforms.ts`).
 *
 * Pure derivation of the six platform rows consumed by the view model:
 * ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Bing Copilot.
 *
 * Readiness comes from the real `platform.perPlatform` (5 ids:
 * aio/chatgpt/perplexity/gemini/copilot); access comes from
 * `crawlers.perBot`. Claude has no `perPlatform` id (the engine does not
 * measure it) → `readiness: null` (rendered "No medido"), while its access
 * still derives from `perBot["Claude-Web"]`.
 *
 * Re-exports `buildPlatformRows` from `@/report/platform-matrix`, the single
 * existing source of this mapping (already covered by platform-matrix tests).
 */
export { buildPlatformRows } from "@/report/platform-matrix";
export type { CrawlerAccess, PlatformRow } from "@/report/platform-matrix";
