import { describe, expect, it } from "vitest";
import {
  acceptsCandidate,
  brandFromDomain,
  isDisambiguationTitle,
  normalizeBrand,
  scoreBrandSignals,
  websiteMatchesDomain,
} from "@/brand/scoring";
import type { BrandScoringInput, WikidataCandidate } from "@/brand/types";

/**
 * Brand scoring unit tests (BRA-2/3/4/5/8, T1). Pure functions - no network.
 * Fixtures: full, mismatch, bare, no-article, disambiguation (tasks.md T1).
 */

const fullInput: BrandScoringInput = {
  brand: "relevy",
  domain: "relevy.app",
  wikipediaTitle: "Relevy",
  wikidata: {
    id: "Q12345",
    label: "Relevy",
    description: "Relevy is an AI visibility analytics platform",
    website: "https://relevy.app",
    instanceOf: ["Q43229"],
    claimCount: 12,
  },
};

describe("scoreBrandSignals (BRA-5 formula 60/25/15)", () => {
  it("returns 0 when entity presence is false - measured, not an error (BRA-5)", () => {
    const result = scoreBrandSignals({
      brand: "relevy",
      domain: "relevy.app",
      wikipediaTitle: null,
      wikidata: null,
    });
    expect(result.status).toBe("success");
    expect(result.reason).toBeNull();
    expect(result.score).toBe(0);
    expect(result.signals).toEqual({
      entityPresence: false,
      entityConsistency: false,
      wikidataCompleteness: 0,
    });
    expect(result.entity).toEqual({
      wikipediaTitle: null,
      wikidataId: null,
      wikidataLabel: null,
    });
  });

  it("scores a full presence ≥ 70: presence 60 + completeness 25 + consistency 15 = 100", () => {
    const result = scoreBrandSignals(fullInput);
    expect(result.score).toBe(100);
    expect(result.signals.entityPresence).toBe(true);
    expect(result.signals.entityConsistency).toBe(true);
    expect(result.signals.wikidataCompleteness).toBe(100);
    expect(result.entity).toEqual({
      wikipediaTitle: "Relevy",
      wikidataId: "Q12345",
      wikidataLabel: "Relevy",
    });
  });

  it("reduces the score on a Wikidata label mismatch (7 instead of 15 consistency)", () => {
    const result = scoreBrandSignals({
      ...fullInput,
      wikidata: { ...fullInput.wikidata!, label: "Relevy Analytics" },
    });
    // 60 presence + 25 completeness + 7 one-side consistency = 92.
    expect(result.score).toBe(92);
    expect(result.signals.entityConsistency).toBe(false);
  });

  it("reduces the score when the Wikipedia title is a disambiguation page (no +20)", () => {
    const result = scoreBrandSignals({
      ...fullInput,
      wikipediaTitle: "Relevy (disambiguation)",
    });
    // 40 presence (no +20) + 25 completeness + 7 consistency (title does not
    // normalize-match "relevy", only the label does) = 72.
    expect(result.score).toBe(72);
  });

  it("reports a low wikidataCompleteness for a bare entity (entity only, 10/25)", () => {
    const bare: WikidataCandidate = {
      id: "Q12345",
      label: "Relevy",
      description: null,
      website: null,
      instanceOf: [],
      claimCount: 0,
    };
    const result = scoreBrandSignals({ ...fullInput, wikidata: bare });
    expect(result.signals.wikidataCompleteness).toBe(40);
    // 60 presence + 10 completeness + 15 consistency = 85.
    expect(result.score).toBe(85);
  });

  it("is deterministic: identical inputs produce identical scores (BRA-8)", () => {
    const first = scoreBrandSignals(fullInput);
    const second = scoreBrandSignals(structuredClone(fullInput));
    expect(second).toEqual(first);
  });
});

describe("acceptsCandidate (BRA-2 disambiguation)", () => {
  const brand = "relevy";
  const domain = "relevy.app";

  it("rejects a person (P31 Q5) even when the description matches", () => {
    const person: WikidataCandidate = {
      id: "Q1",
      label: "Relevy",
      description: "Relevy is an American singer-songwriter",
      website: null,
      instanceOf: ["Q5"],
      claimCount: 3,
    };
    expect(acceptsCandidate(person, brand, domain)).toBe(false);
  });

  it("rejects a fictional character (P31 Q95074)", () => {
    const character: WikidataCandidate = {
      id: "Q2",
      label: "Relevy",
      description: "Relevy is a fictional character",
      website: null,
      instanceOf: ["Q95074"],
      claimCount: 3,
    };
    expect(acceptsCandidate(character, brand, domain)).toBe(false);
  });

  it("rejects a same-name organization whose description and website do not match", () => {
    const unrelated: WikidataCandidate = {
      id: "Q3",
      label: "Relevy",
      description: "Manufacturer of plumbing fixtures",
      website: null,
      instanceOf: ["Q43229"],
      claimCount: 4,
    };
    expect(acceptsCandidate(unrelated, brand, domain)).toBe(false);
  });

  it("accepts an organization matching by description (label-only is insufficient)", () => {
    const byDescription: WikidataCandidate = {
      id: "Q4",
      label: "Relevy",
      description: "Relevy is an AI visibility analytics platform",
      website: null,
      instanceOf: ["Q43229"],
      claimCount: 8,
    };
    expect(acceptsCandidate(byDescription, brand, domain)).toBe(true);
  });

  it("accepts an organization whose official website matches the audited domain", () => {
    const byWebsite: WikidataCandidate = {
      id: "Q5",
      label: "Relevy",
      description: null,
      website: "https://relevy.app",
      instanceOf: ["Q4830453"],
      claimCount: 6,
    };
    expect(acceptsCandidate(byWebsite, brand, domain)).toBe(true);
  });

  it("accepts a bare entity (no P31) only on official-website domain match", () => {
    const bareWithWebsite: WikidataCandidate = {
      id: "Q6",
      label: "Relevy",
      description: null,
      website: "https://www.relevy.app",
      instanceOf: [],
      claimCount: 0,
    };
    expect(acceptsCandidate(bareWithWebsite, brand, domain)).toBe(true);

    const bareWithoutWebsite: WikidataCandidate = {
      id: "Q7",
      label: "Relevy",
      description: null,
      website: null,
      instanceOf: [],
      claimCount: 0,
    };
    expect(acceptsCandidate(bareWithoutWebsite, brand, domain)).toBe(false);
  });

  it("rejects an entity whose P31 type is not in the accepted set", () => {
    const unknownType: WikidataCandidate = {
      id: "Q8",
      label: "Relevy",
      description: "Relevy is an AI visibility analytics platform",
      website: null,
      instanceOf: ["Q7397"], // software - not in the accepted organization set
      claimCount: 5,
    };
    expect(acceptsCandidate(unknownType, brand, domain)).toBe(false);
  });

  it("accepts business/company/enterprise P31 types", () => {
    for (const qid of ["Q4830453", "Q783794", "Q6881511"]) {
      const candidate: WikidataCandidate = {
        id: `Q-${qid}`,
        label: "Relevy",
        description: "Relevy is an AI visibility analytics platform",
        website: null,
        instanceOf: [qid],
        claimCount: 5,
      };
      expect(acceptsCandidate(candidate, brand, domain)).toBe(true);
    }
  });
});

describe("brandFromDomain (BRA-1 brand derivation)", () => {
  it("derives the brand from the registrable domain (eTLD+1)", () => {
    expect(brandFromDomain("relevy.app")).toBe("Relevy");
    expect(brandFromDomain("www.acme.co.uk")).toBe("Acme");
    expect(brandFromDomain("blog.example.com")).toBe("Example");
  });

  it("resolves a subdomain to the registrable brand (docs.anthropic.com → Anthropic)", () => {
    expect(brandFromDomain("docs.anthropic.com")).toBe("Anthropic");
  });

  it("strips www and capitalizes the registrable label (www.moz.com → Moz)", () => {
    expect(brandFromDomain("www.moz.com")).toBe("Moz");
  });

  it("takes three labels for two-part TLDs (.com.ar, .com.au)", () => {
    expect(brandFromDomain("www.example.com.ar")).toBe("Example");
    expect(brandFromDomain("blog.acme.com.au")).toBe("Acme");
  });
});

describe("normalizeBrand (design D2 normalization)", () => {
  it("lowercases and strips legal suffixes", () => {
    expect(normalizeBrand("Acme, Inc.")).toBe("acme");
    expect(normalizeBrand("Acme Ltd")).toBe("acme");
    expect(normalizeBrand("ACME S.A.")).toBe("acme");
  });
});

describe("isDisambiguationTitle", () => {
  it("detects Wikipedia disambiguation titles", () => {
    expect(isDisambiguationTitle("Relevy (disambiguation)")).toBe(true);
    expect(isDisambiguationTitle("Relevy")).toBe(false);
  });
});

describe("websiteMatchesDomain", () => {
  it("matches the official website host against the audited domain", () => {
    expect(websiteMatchesDomain("https://relevy.app", "relevy.app")).toBe(true);
    expect(websiteMatchesDomain("https://www.relevy.app", "relevy.app")).toBe(
      true,
    );
    expect(websiteMatchesDomain("https://acme.app", "relevy.app")).toBe(false);
    expect(websiteMatchesDomain(null, "relevy.app")).toBe(false);
    expect(websiteMatchesDomain("not-a-url", "relevy.app")).toBe(false);
  });
});
