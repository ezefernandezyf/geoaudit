import type { CheerioAPI } from "cheerio";
import type { DimensionResult, EeatFinding } from "./types";
import { pageText, paragraphTexts } from "./text";

/**
 * Experience dimension (REE-1, 0-25). Proxy signals for first-hand knowledge:
 *
 * - First-person paragraph leads (design regex `/^(we|our team|I)\b/i`) - 5
 *   points per matching paragraph, capped at 10.
 * - Case-study phrasing anywhere in the visible text (phrase list) - 5 points
 *   per distinct phrase, capped at 10.
 * - A "Case Study:"-style heading - 5 points.
 *
 * Heuristic calibration per design R3 (single-page proxy; labeled downstream).
 */

export const EXPERIENCE_FIRST_PERSON = /^(?:we|our team|i)\b/i;
export const EXPERIENCE_CASE_PHRASES = [
  "case study",
  "we deployed",
  "we implemented",
  "we tested",
  "we built",
  "we measured",
  "our team found",
  "we surveyed",
  "in our experience",
  "we ran",
] as const;

export const EXPERIENCE_FIRST_PERSON_PER_HIT = 5;
export const EXPERIENCE_FIRST_PERSON_CAP = 10;
export const EXPERIENCE_CASE_PHRASE_PER_HIT = 5;
export const EXPERIENCE_CASE_PHRASE_CAP = 10;
export const EXPERIENCE_CASE_HEADING_BONUS = 5;
export const EXPERIENCE_MAX = 25;

const CASE_HEADING_PATTERN = /\bcase\s*study\b/i;

/** Distinct case-study phrases present in the text (deduped). */
function distinctCasePhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return EXPERIENCE_CASE_PHRASES.filter((phrase) => lower.includes(phrase));
}

export function scoreExperience($: CheerioAPI): DimensionResult {
  const findings: EeatFinding[] = [];
  const leads = paragraphTexts($).filter((paragraph) =>
    EXPERIENCE_FIRST_PERSON.test(paragraph),
  );
  const phrases = distinctCasePhrases(pageText($));
  // Per-element text: `.text()` on a multi-element selection concatenates
  // headings without separators ("chain" + "Case Study" -> "chainCase"),
  // which breaks the word-boundary in CASE_HEADING_PATTERN.
  let caseHeading = false;
  $("h1, h2, h3, h4").each((_index, element) => {
    if (CASE_HEADING_PATTERN.test($(element).text())) caseHeading = true;
  });

  let score = 0;
  if (leads.length > 0) {
    score += Math.min(
      EXPERIENCE_FIRST_PERSON_CAP,
      leads.length * EXPERIENCE_FIRST_PERSON_PER_HIT,
    );
    findings.push({
      key: "first_person",
      label: "First-person accounts detected",
      detail: `${leads.length} paragraph(s)`,
    });
  }
  if (phrases.length > 0) {
    score += Math.min(
      EXPERIENCE_CASE_PHRASE_CAP,
      phrases.length * EXPERIENCE_CASE_PHRASE_PER_HIT,
    );
    findings.push({
      key: "case_study_phrase",
      label: "Case-study phrasing detected",
      detail: phrases.join(", "),
    });
  }
  if (caseHeading) {
    score += EXPERIENCE_CASE_HEADING_BONUS;
    findings.push({
      key: "case_study_heading",
      label: "Case Study section heading present",
    });
  }
  return { score: Math.min(EXPERIENCE_MAX, score), findings };
}
