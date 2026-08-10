import type { CheerioAPI } from "cheerio";
import type { PlatformFinding, SsrAnalysis, SsrStatus } from "./types";

/**
 * SSR detection + question/answer structure (RPL-5, RPL-8, RPL-9).
 *
 * `analyzeSsr($, html)` classifies the page as server-rendered when the raw
 * HTML contains >= MIN_SSR_CHARS of visible text (script/style stripped),
 * otherwise as an empty client-side shell — Critical for AI visibility.
 * It also counts question-pattern H2/H3 headings (RPL-8) and the direct
 * answers that follow them (RPL-9, first <p> before the next heading).
 *
 * The shared DOM is never mutated: all measurement runs on a body clone
 * (single-load DOM per RAO-3).
 */

export const MIN_SSR_CHARS = 500;
export const CRITICAL_SHELL_CHARS = 100;

const QUESTION_START =
  /^(what|who|whom|whose|which|when|where|why|how|is|are|was|were|do|does|did|can|could|should|would|will|may|might)\b/i;
const QUESTION_END = /\?\s*$/;

export function isQuestionHeading(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.length > 0 &&
    (QUESTION_END.test(trimmed) || QUESTION_START.test(trimmed))
  );
}

/** Clone of <body> with non-visible regions stripped; the shared DOM is untouched. */
function visibleBodyText($: CheerioAPI): string {
  const body = $("body").clone();
  body.find("script, style, noscript, template").remove();
  return body.text() ?? "";
}

function countQuestionHeadings($: CheerioAPI): number {
  let count = 0;
  $("h2, h3").each((_index, element) => {
    if (isQuestionHeading($(element).text())) count += 1;
  });
  return count;
}

/**
 * Direct-answer count (RPL-9): for each question heading, the first <p>
 * encountered among the following siblings before the next heading counts
 * as the direct answer. A question with no paragraph before the next
 * heading (or the end of the section) has no answer.
 */
function countDirectAnswers($: CheerioAPI): number {
  let count = 0;
  $("h2, h3").each((_index, element) => {
    const $heading = $(element);
    if (!isQuestionHeading($heading.text())) return;
    let resolved = false;
    $heading.nextAll().each((_siblingIndex, sibling) => {
      if (resolved) return;
      const tagName = ($(sibling).prop("tagName") ?? "").toUpperCase();
      if (tagName.length === 2 && tagName.startsWith("H")) {
        resolved = true; // next heading with no answer in between
        return;
      }
      if (tagName === "P" && $(sibling).text().trim().length > 0) {
        count += 1;
        resolved = true;
      }
    });
  });
  return count;
}

export function analyzeSsr($: CheerioAPI, html: string): SsrAnalysis {
  const visibleText = visibleBodyText($);
  const visibleTextLength = visibleText.length;
  const htmlLength = html.length;
  const textHtmlRatio =
    htmlLength > 0
      ? Math.round((visibleTextLength / htmlLength) * 10000) / 10000
      : 0;
  const status: SsrStatus =
    visibleTextLength >= MIN_SSR_CHARS ? "ssr_present" : "client_side_shell";

  const findings: PlatformFinding[] = [];
  if (visibleTextLength < CRITICAL_SHELL_CHARS) {
    findings.push({
      key: "no_ssr_detected",
      severity: "Critical",
      message:
        "Page contains less than 100 characters of server-rendered text — AI crawlers see an empty client-side shell.",
    });
  } else if (status === "client_side_shell") {
    findings.push({
      key: "thin_ssr_content",
      severity: "Medium",
      message:
        "Page renders little server-side content (<500 visible characters).",
    });
  }

  return {
    status,
    visibleTextLength,
    htmlLength,
    textHtmlRatio,
    questionHeadingCount: countQuestionHeadings($),
    directAnswerCount: countDirectAnswers($),
    findings,
  };
}
