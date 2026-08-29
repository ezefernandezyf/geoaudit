#!/usr/bin/env node
/**
 * Lighthouse measurement runner (C15, WU-C3 — PERF-1/PERF-2/PERF-3).
 *
 * Measures the main pages against the desktop preset (formFactor desktop,
 * unthrottled CPU, 40ms RTT / 10Mbps simulated throttling — the same values
 * the `--preset=desktop` CLI flag applies) and prints a compact category-score
 * table. Full JSON reports are saved under `.lighthouse/` (gitignored) as
 * evidence for `docs/performance.md`.
 *
 * Usage:
 *   pnpm dev                      # terminal 1 — the dev server must be up
 *   pnpm lighthouse               # measure landing and report
 *   pnpm lighthouse report        # measure a single page
 *
 * Env overrides:
 *   LH_BASE_URL     base URL of the app (default http://localhost:3000)
 *   LH_REPORT_URL   URL the report page audits (default https://example.com)
 *   CHROME_PATH     explicit Chrome/Chromium binary (else auto-detected:
 *                   system chrome, then the Playwright/Puppeteer caches)
 *
 * The report page runs a live server-side audit (runAudit under Suspense), so
 * its numbers include that real network + engine time — that is the documented
 * PERF-3 deviation, not a bug in the tooling.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, "..");
const OUTPUT_DIR = path.join(REPO_ROOT, ".lighthouse");

/** Pages measured by default; the report page audits a live URL (PERF-2). */
const PAGES = {
  landing: { path: "/", label: "Landing" },
  report: { path: "/report", label: "Report (live audit)" },
};

/** Mirrors the lighthouse CLI `--preset=desktop` settings (C15, PERF-2). */
const DESKTOP_CONFIG = {
  extends: "lighthouse:default",
  settings: {
    formFactor: "desktop",
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

const CATEGORY_LABELS = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best Practices",
  seo: "SEO",
};

/** Candidate Chrome/Chromium binaries, most desirable first. */
function chromeCandidates() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  candidates.push(
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  );
  for (const cacheRoot of [
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(os.homedir(), ".cache", "puppeteer"),
  ]) {
    if (!fs.existsSync(cacheRoot)) continue;
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (
            entry.name === "chrome-linux" ||
            entry.name === "chrome-linux64"
          ) {
            candidates.push(path.join(full, "chrome"));
          } else if (!entry.name.startsWith(".")) {
            walk(full);
          }
        }
      }
    };
    walk(cacheRoot);
  }
  return candidates.filter((p) => p && fs.existsSync(p));
}

function resolveChromePath() {
  const found = chromeCandidates()[0];
  if (!found) {
    console.error(
      "No Chrome/Chromium binary found. Install one, or point CHROME_PATH at an existing binary.",
    );
    process.exit(2);
  }
  return found;
}

function buildUrl(pageName) {
  const base = process.env.LH_BASE_URL ?? "http://localhost:3000";
  if (pageName === "report") {
    const target = process.env.LH_REPORT_URL ?? "https://example.com";
    return `${base}/report?url=${encodeURIComponent(target)}`;
  }
  return `${base}${PAGES[pageName].path}`;
}

async function measure(pageName) {
  const url = buildUrl(pageName);
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: resolveChromePath(),
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });

  let runnerResult;
  try {
    const page = await browser.newPage();
    // Lighthouse 13 no longer auto-launches Chrome: the 4th argument is a
    // Puppeteer Page connected to a browser this script controls.
    runnerResult = await lighthouse(
      url,
      { output: "json", logLevel: "error", maxWaitForLoad: 120_000 },
      DESKTOP_CONFIG,
      page,
    );
  } finally {
    await browser.close();
  }

  if (!runnerResult) {
    throw new Error("Lighthouse returned no result (is the dev server up?)");
  }

  const report = runnerResult.lhr;
  const scores = {};
  for (const [key, category] of Object.entries(report.categories)) {
    if (category.score === null || category.score === undefined) continue;
    scores[key] = Math.round(category.score * 100);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(OUTPUT_DIR, `${pageName}-${stamp}.json`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  return { pageName, url, scores, outFile };
}

function printTable(results) {
  const headers = ["Page", "URL", ...Object.values(CATEGORY_LABELS)];
  const rows = results.map((r) => [
    PAGES[r.pageName].label,
    r.url,
    ...Object.keys(CATEGORY_LABELS).map((key) =>
      r.scores[key] !== undefined ? String(r.scores[key]) : "-",
    ),
  ]);
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i].length)),
  );
  const line = (cells) =>
    cells
      .map((c, i) => c.padEnd(widths[i]))
      .join("  ")
      .trimEnd();
  console.log(line(headers));
  console.log("-".repeat(widths.reduce((a, w) => a + w + 2, 0)));
  for (const row of rows) console.log(line(row));
}

const requested = process.argv[2];
const pagesToRun = requested ? [requested] : Object.keys(PAGES);
const invalid = pagesToRun.filter((name) => !PAGES[name]);
if (invalid.length > 0) {
  console.error(
    `Unknown page(s): ${invalid.join(", ")}. Valid: ${Object.keys(PAGES).join(", ")}`,
  );
  process.exit(1);
}

console.log(`Chrome: ${resolveChromePath()}`);
console.log(`Measuring: ${pagesToRun.join(", ")}\n`);

const results = [];
let failed = false;
for (const name of pagesToRun) {
  try {
    console.log(`→ ${PAGES[name].label} (${buildUrl(name)})…`);
    const result = await measure(name);
    results.push(result);
    console.log(`  saved ${result.outFile}`);
  } catch (error) {
    failed = true;
    console.error(`  ✗ ${PAGES[name].label}: ${error.message}`);
  }
}

if (results.length > 0) {
  console.log("\nCategory scores (0-100, desktop preset):");
  printTable(results);
}

process.exit(failed ? 1 : 0);
