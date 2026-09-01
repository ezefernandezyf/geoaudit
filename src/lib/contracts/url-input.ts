import { z } from "zod";

/**
 * Shared URL input contract (single source of truth, server + client).
 * Zod 4 - see openspec/specs/project-setup and AGENTS.md conventions.
 */
export const urlInputSchema = z.object({
  url: z.url("Invalid URL format"),
});

export type UrlInput = z.infer<typeof urlInputSchema>;
