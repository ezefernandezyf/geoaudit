import { describe, expect, it } from "vitest";
import {
  NOT_MEASURED_NOTE,
  applyBrandCriteria,
  scorePlatforms,
} from "@/platform/per-platform";
import type { PlatformScore, PlatformStructure } from "@/platform/types";

/**
 * T6 - applyBrandCriteria (RPL-10 "External criteria split", RPL-11, design D8).
 *
 * The brand engine unlocks 4 external criteria: chatgpt.wikipedia (15),
 * chatgpt.wikidata (10), chatgpt.entity_consistency (5) and
 * perplexity.wikipedia_wikidata (5) flip to "measured" with points sourced
 * from the brand signals (0 when there is no external presence). The
 * remaining external criteria (YouTube, Reddit, Bing, backlinks, LinkedIn,
 * GitHub, ...) stay "not_measured" with the pending-TODO note. Brand points
 * land ONLY on chatgpt/perplexity - never on AIO (which feeds the platform
 * dimension) so the 20% brand weight is not double-counted.
 *
 * Pure function: the input record is never mutated.
 */

/** On-page structure with deterministic rubric output (chatgpt 10, perplexity 40, aio 70). */
const STRUCTURE: PlatformStructure = {
  questionHeadings: 4,
  directAnswers: 5,
  hasTables: true,
  hasLists: true,
  hasFaqSection: true,
  faqQuestions: 5,
  hasDates: true,
  hasAuthorByline: true,
  hasAboutSection: false,
  hasMetaDescription: true,
  metaDescriptionLength: 140,
  hasStructuredData: true,
  isSsrPresent: true,
  wordCount: 2500,
  headingHierarchyClean: true,
  imageAltCoverage: 1,
  hasImages: true,
};

function findCriterion(platform: PlatformScore, key: string) {
  const criterion = platform.criteria.find((c) => c.key === key);
  if (!criterion) throw new Error(`missing criterion ${key}`);
  return criterion;
}

describe("applyBrandCriteria (RPL-11 split, design D8)", () => {
  it("flips the 4 Wikipedia/Wikidata criteria to measured with full brand points", () => {
    const base = scorePlatforms(STRUCTURE);
    const result = applyBrandCriteria(base, {
      entityPresence: true,
      entityConsistency: true,
      wikidataId: "Q111",
    });

    const wikipedia = findCriterion(result.chatgpt, "wikipedia");
    expect(wikipedia.status).toBe("measured");
    expect(wikipedia.note).toBeNull();
    expect(wikipedia.points).toBe(15);

    const wikidata = findCriterion(result.chatgpt, "wikidata");
    expect(wikidata.status).toBe("measured");
    expect(wikidata.note).toBeNull();
    expect(wikidata.points).toBe(10);

    const consistency = findCriterion(result.chatgpt, "entity_consistency");
    expect(consistency.status).toBe("measured");
    expect(consistency.note).toBeNull();
    expect(consistency.points).toBe(5);

    const perplexityWw = findCriterion(result.perplexity, "wikipedia_wikidata");
    expect(perplexityWw.status).toBe("measured");
    expect(perplexityWw.note).toBeNull();
    expect(perplexityWw.points).toBe(5);

    // Scores recompute over the measured criteria: chatgpt 10+30, perplexity 40+5.
    expect(result.chatgpt.score).toBe(40);
    expect(result.perplexity.score).toBe(45);
  });

  it("keeps every other external criterion not_measured with the pending TODO note", () => {
    const base = scorePlatforms(STRUCTURE);
    const result = applyBrandCriteria(base, {
      entityPresence: true,
      entityConsistency: true,
      wikidataId: "Q111",
    });

    // key -> platform where the criterion lives (from the five rubrics).
    const remaining: Array<[keyof typeof result, string]> = [
      ["chatgpt", "reddit"],
      ["chatgpt", "youtube"],
      ["chatgpt", "bing_index"],
      ["chatgpt", "authoritative_backlinks"],
      ["chatgpt", "bing_wmt"],
      ["perplexity", "community_forums"],
      ["perplexity", "multi_source"],
      ["perplexity", "discussion_engagement"],
      ["gemini", "knowledge_panel"],
      ["gemini", "business_profile"],
      ["gemini", "google_ecosystem"],
      ["gemini", "merchant_center"],
      ["copilot", "indexnow"],
      ["copilot", "linkedin"],
      ["copilot", "github"],
      ["copilot", "social_signals"],
    ];
    expect(remaining.length).toBeGreaterThan(0);
    for (const [platform, key] of remaining) {
      const criterion = findCriterion(result[platform], key);
      expect(criterion.status).toBe("not_measured");
      expect(criterion.points).toBe(0);
      expect(criterion.note).toBe(NOT_MEASURED_NOTE);
    }
  });

  it("never touches aio (no double-count with the 20% brand weight)", () => {
    const base = scorePlatforms(STRUCTURE);
    const result = applyBrandCriteria(base, {
      entityPresence: true,
      entityConsistency: true,
      wikidataId: "Q111",
    });

    expect(result.aio).toBe(base.aio);
    expect(result.aio.score).toBe(70);
    const wikipedia = findCriterion(result.aio, "top10_rank");
    expect(wikipedia.status).toBe("not_measured");
  });

  it("sources 0 points from a brand with no external presence (brand = 0)", () => {
    const base = scorePlatforms(STRUCTURE);
    const result = applyBrandCriteria(base, {
      entityPresence: false,
      entityConsistency: false,
      wikidataId: null,
    });

    expect(findCriterion(result.chatgpt, "wikipedia").points).toBe(0);
    expect(findCriterion(result.chatgpt, "wikidata").points).toBe(0);
    expect(findCriterion(result.chatgpt, "entity_consistency").points).toBe(0);
    expect(findCriterion(result.perplexity, "wikipedia_wikidata").points).toBe(
      0,
    );

    // Scores stay at the on-page baseline: chatgpt 10, perplexity 40.
    expect(result.chatgpt.score).toBe(10);
    expect(result.perplexity.score).toBe(40);
  });

  it("sources partial points from partial brand signals (triangulation)", () => {
    const base = scorePlatforms(STRUCTURE);
    const result = applyBrandCriteria(base, {
      entityPresence: true,
      entityConsistency: false,
      wikidataId: null,
    });

    expect(findCriterion(result.chatgpt, "wikipedia").points).toBe(15);
    expect(findCriterion(result.chatgpt, "wikidata").points).toBe(0);
    expect(findCriterion(result.chatgpt, "entity_consistency").points).toBe(0);
    expect(findCriterion(result.perplexity, "wikipedia_wikidata").points).toBe(
      5,
    );
    expect(result.chatgpt.score).toBe(25);
  });

  it("is pure: never mutates the input platforms record", () => {
    const base = scorePlatforms(STRUCTURE);
    const before = {
      chatgpt: base.chatgpt.score,
      perplexity: base.perplexity.score,
      wikipediaStatus: findCriterion(base.chatgpt, "wikipedia").status,
      wikipediaNote: findCriterion(base.chatgpt, "wikipedia").note,
    };

    applyBrandCriteria(base, {
      entityPresence: true,
      entityConsistency: true,
      wikidataId: "Q111",
    });

    expect(base.chatgpt.score).toBe(before.chatgpt);
    expect(base.perplexity.score).toBe(before.perplexity);
    expect(findCriterion(base.chatgpt, "wikipedia").status).toBe(
      before.wikipediaStatus,
    );
    expect(findCriterion(base.chatgpt, "wikipedia").note).toBe(
      before.wikipediaNote,
    );
  });
});
