import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { analyzeSsr, isQuestionHeading } from "@/platform/ssr";

const fixturesDir = path.join(__dirname, "..", "__fixtures__");

function page(name: string) {
  const html = fs.readFileSync(path.join(fixturesDir, name), "utf8");
  return { $: load(html), html };
}

describe("isQuestionHeading (RPL-8 patterns)", () => {
  it("matches question starts and trailing question marks only", () => {
    expect(isQuestionHeading("What is GEO?")).toBe(true);
    expect(isQuestionHeading("How to get started")).toBe(true);
    expect(isQuestionHeading("Why does it matter?")).toBe(true);
    expect(isQuestionHeading("Can AI help?")).toBe(true);
    expect(isQuestionHeading("Best practices")).toBe(false);
    expect(isQuestionHeading("")).toBe(false);
  });
});

describe("analyzeSsr (RPL-5)", () => {
  it("classifies a content-rich page as ssr_present and reports the text/HTML ratio", () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = analyzeSsr($, html);
    expect(result.status).toBe("ssr_present");
    expect(result.visibleTextLength).toBeGreaterThanOrEqual(500);
    expect(result.htmlLength).toBeGreaterThan(0);
    expect(result.textHtmlRatio).toBeGreaterThan(0);
    expect(result.textHtmlRatio).toBeLessThanOrEqual(1);
    expect(result.findings).toEqual([]);
  });

  it("classifies an empty client-side shell and raises a Critical finding", () => {
    const { $, html } = page("page-ssr-shell.html");
    const result = analyzeSsr($, html);
    expect(result.status).toBe("client_side_shell");
    expect(result.visibleTextLength).toBeLessThan(100);
    const finding = result.findings.find((f) => f.key === "no_ssr_detected");
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("Critical");
  });
});

describe("analyzeSsr question and direct-answer detection (RPL-8, RPL-9)", () => {
  it("counts the question-pattern H2/H3 headings on the rich page", () => {
    const { $, html } = page("page-ssr-rich.html");
    const result = analyzeSsr($, html);
    expect(result.questionHeadingCount).toBe(5);
    expect(result.directAnswerCount).toBe(5);
  });

  it("detects only the first paragraph after a question heading (RPL-9)", () => {
    const { $, html } = page("page-questions.html");
    const result = analyzeSsr($, html);
    expect(result.questionHeadingCount).toBe(4);
    expect(result.directAnswerCount).toBe(3);
  });

  it("does not mutate the shared DOM while measuring", () => {
    const { $, html } = page("page-ssr-rich.html");
    analyzeSsr($, html);
    expect($('script[type="application/ld+json"]').length).toBe(1);
    expect($("p").length).toBeGreaterThan(5);
  });
});
