# Crawler Access Map Specification

## Purpose

Determine which AI crawlers can access a target URL by parsing `robots.txt` (RFC 9309 subset), HTTP response headers (`X-Robots-Tag`), and HTML `<meta name="robots">` directives. Produce a per-bot access map with tiered impact classification and an aggregate crawler access score that contributes to the Technical GEO dimension.

## Requirements

| # | Requirement | Strength | Summary |
|---|-------------|----------|---------|
| RCR-1 | Bot registry | MUST | A static registry MUST define 17 user agents with tier and impact classifications |
| RCR-2 | robots.txt fetch | MUST | The system MUST fetch and parse the target's `robots.txt` (or treat 404/missing as "all allowed") |
| RCR-3 | RFC 9309 matching | MUST | Robots.txt group selection MUST follow RFC 9309 subset: case-insensitive, exact-token > `*`, longest-match tiebreak, Allow wins ties, `$` anchor |
| RCR-4 | Per-bot access status | MUST | Each bot MUST be classified as Allowed, Blocked, or Not Mentioned with the matched directive line |
| RCR-5 | X-Robots-Tag header | MUST | The page HTTP response `X-Robots-Tag` header MUST be parsed, including bot-scoped values (e.g., `googlebot: noindex`) |
| RCR-6 | Meta robots directives | MUST | HTML `<meta name="robots">` tags MUST be parsed for `noindex`, `nofollow`, `noai`, `noimageai`, and bot-specific values |
| RCR-7 | Ancillary directives | SHOULD | Crawl-delay, Sitemap, and Content-Signal (IETF draft — informational only) SHOULD be parsed from robots.txt |
| RCR-8 | Crawler access score | MUST | A composite score MUST be computed: Tier 1 bots 50%, Tier 2 bots 25%, no-blanket-block bonus 15%, AI-files presence 10% |
| RCR-9 | Output shape | MUST | Per-bot output MUST include: userAgent, tier, status (Allowed/Blocked/NotMentioned), matchedRule, impact (Critical/High/Medium), recommendation |
| RCR-10 | Empty/missing robots.txt | MUST | 404 or empty robots.txt MUST return Allowed for all bots |
| RCR-11 | Disallow-all | MUST | `User-agent: *` + `Disallow: /` MUST mark all unlisted bots as Blocked; bot-specific rules in other groups MUST still apply |

### Requirement: Bot Registry (RCR-1)

The system MUST define a static registry of 17 AI crawler user agents with tier and impact classifications matching the product contract (brief §8.2).

#### Scenario: Registry validates all 17 bots

- GIVEN the bot registry is loaded
- WHEN the registry is iterated
- THEN 17 entries exist with unique userAgent strings
- AND each entry has a tier (Tier1/Tier2/Other) and an impact level (Critical/High/Medium)

#### Scenario: Tier 1 bots are critical

- GIVEN the bot registry
- WHEN tier 1 bots are selected (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot)
- THEN each has impact "Critical"

### Requirement: RFC 9309 Matching (RCR-3)

The system MUST implement RFC 9309 group selection rules: case-insensitive user-agent matching, exact token > `*`, longest-match tiebreak, Allow wins over Disallow on ties, and `$` anchor for path-end matching.

#### Scenario: Exact bot token takes precedence over wildcard

- GIVEN robots.txt contains `User-agent: GPTBot\nDisallow: /private` and `User-agent: *\nAllow: /private`
- WHEN access is evaluated for "GPTBot"
- THEN "GPTBot" is Disallowed for /private (exact-match group wins)
- AND other bots are Allowed via wildcard group

#### Scenario: Allow wins ties on same path length

- GIVEN robots.txt contains `User-agent: *\nAllow: /api\nDisallow: /api`
- WHEN access is evaluated for any bot to /api
- THEN the bot is Allowed (Allow wins tie)

#### Scenario: $ anchor matches exact path end

- GIVEN robots.txt contains `Disallow: /tmp$`
- WHEN access is evaluated for `/tmp` vs `/tmp/file`
- THEN `/tmp` is Disallowed
- AND `/tmp/file` is Allowed (no $ match)

#### Scenario: Case-insensitive user-agent matching

- GIVEN robots.txt contains `User-agent: gptbot\nDisallow: /`
- WHEN access is evaluated for agent "GPTBot" (different case)
- THEN the rule matches and the bot is Disallowed

#### Scenario: Longest-match tiebreak

- GIVEN robots.txt contains one group with `Disallow: /a` and another with `Disallow: /a/b`
- WHEN access is evaluated for `/a/b/c`
- THEN `/a/b` match (longer) is chosen over `/a`

### Requirement: Per-Bot Access Status (RCR-4)

Each bot MUST be classified with its access status and the matched directive line for audit transparency.

#### Scenario: Bot explicitly allowed

- GIVEN robots.txt contains `User-agent: GPTBot\nAllow: /`
- WHEN per-bot status is computed for GPTBot
- THEN status is "Allowed"
- AND matchedRule shows the Allow directive line

#### Scenario: Bot not mentioned falls back to wildcard

- GIVEN robots.txt contains only `User-agent: *\nDisallow: /admin`
- WHEN per-bot status is computed for an unlisted bot
- THEN status is "Allowed" (non-/admin paths) or "Blocked" (/admin paths)
- AND matchedRule references the wildcard group

### Requirement: X-Robots-Tag Header (RCR-5)

The system MUST parse the page HTTP `X-Robots-Tag` header for crawler directives at both global and bot-specific scope.

#### Scenario: Global noindex via header

- GIVEN HTTP response includes `X-Robots-Tag: noindex`
- WHEN headers are parsed
- THEN all bots show a noindex flag with source "header"

#### Scenario: Bot-scoped header directive

- GIVEN HTTP response includes `X-Robots-Tag: googlebot: noindex`
- WHEN headers are parsed for Googlebot
- THEN Googlebot shows noindex from header
- AND non-Googlebot bots are unaffected

### Requirement: Meta Robots Directives (RCR-6)

The system MUST parse HTML `<meta name="robots">` tags for crawler directives.

#### Scenario: noai meta directive

- GIVEN HTML contains `<meta name="robots" content="noai">`
- WHEN meta tags are parsed
- THEN the noai flag is captured
- AND bots known to respect noai (GPTBot, CCBot, anthropic-ai) are flagged

#### Scenario: Bot-specific meta directive

- GIVEN HTML contains `<meta name="googlebot" content="noindex">`
- WHEN meta tags are parsed
- THEN the directive applies only to Googlebot
- AND other bots show no restriction from this meta tag

### Requirement: Crawler Access Score (RCR-8)

The system MUST compute an aggregate crawler access score using the weighted rubric.

#### Scenario: All tier 1 bots allowed

- GIVEN all 5 tier 1 bots are Allowed
- AND all tier 2 bots are Allowed
- AND no blanket block exists
- WHEN the crawler score is computed
- THEN the score is 100

#### Scenario: Tier 1 bot blocked

- GIVEN GPTBot is Blocked (tier 1)
- AND all other bots are Allowed
- WHEN the crawler score is computed
- THEN the score is measurably reduced from 100
- AND the tier 1 penalty is proportional (50% weight distributed across 5 bots)

### Requirement: Disallow-All (RCR-11)

A robots.txt with `User-agent: *` and `Disallow: /` MUST block all bots except those with explicit Allow directives in their own groups.

#### Scenario: Disallow-all with bot-specific Allow

- GIVEN robots.txt contains `User-agent: *\nDisallow: /` and `User-agent: GPTBot\nAllow: /`
- WHEN access is evaluated
- THEN GPTBot is Allowed (explicit group)
- AND all other bots are Blocked by wildcard

## Compliance Matrix

| Requirement | Scenarios | Coverage |
|-------------|-----------|----------|
| RCR-1 | Registry validates all 17 bots, Tier 1 bots are critical | Covered |
| RCR-2 | (tested via RCR-4 scenarios) | Implicit |
| RCR-3 | Exact token > wildcard, Allow wins ties, $ anchor, Case-insensitive, Longest-match | Covered |
| RCR-4 | Bot explicitly allowed, Bot falls back to wildcard | Covered |
| RCR-5 | Global noindex via header, Bot-scoped header directive | Covered |
| RCR-6 | noai meta directive, Bot-specific meta directive | Covered |
| RCR-7 | (informational — tested in crawler-access-score composite) | Partial |
| RCR-8 | All tier 1 allowed, Tier 1 bot blocked | Covered |
| RCR-9 | (tested via RCR-4 + RCR-8 scenarios) | Implicit |
| RCR-10 | (404/empty → all Allowed — fixture test) | Covered |
| RCR-11 | Disallow-all with bot-specific Allow | Covered |
