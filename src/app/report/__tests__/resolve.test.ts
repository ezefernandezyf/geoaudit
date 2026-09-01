import { describe, expect, it } from "vitest";
import { resolveReportUrl } from "@/app/report/resolve";

/**
 * U3.T1 - URL resolution logic (ARU-2/ARU-5): the pure decision that turns
 * `searchParams` into either a valid audit URL or the empty state.
 * Extracted from the RSC so the branch logic is testable without rendering.
 */

describe("resolveReportUrl (ARU-2/ARU-5)", () => {
  it("resolves a valid https URL to status valid", () => {
    expect(resolveReportUrl({ url: "https://ejemplo.com" })).toEqual({
      status: "valid",
      url: "https://ejemplo.com",
    });
  });

  it("resolves a valid http URL to status valid (runAudit normalizes later)", () => {
    expect(resolveReportUrl({ url: "http://ejemplo.com" })).toEqual({
      status: "valid",
      url: "http://ejemplo.com",
    });
  });

  it("returns empty with empty input when the url param is missing", () => {
    expect(resolveReportUrl({})).toEqual({ status: "empty", input: "" });
    expect(resolveReportUrl({ other: "x" })).toEqual({
      status: "empty",
      input: "",
    });
  });

  it("returns empty when the url param is an empty string", () => {
    expect(resolveReportUrl({ url: "" })).toEqual({
      status: "empty",
      input: "",
    });
  });

  it("returns empty when the url param is an array (repeated param)", () => {
    expect(resolveReportUrl({ url: ["https://ejemplo.com"] })).toEqual({
      status: "empty",
      input: "",
    });
  });

  it("returns empty with the raw input when the url is malformed", () => {
    expect(resolveReportUrl({ url: "not a url" })).toEqual({
      status: "empty",
      input: "not a url",
    });
  });

  it("returns empty with the raw input when the protocol is not http/https", () => {
    expect(resolveReportUrl({ url: "ftp://x" })).toEqual({
      status: "empty",
      input: "ftp://x",
    });
  });

  it("returns empty with the raw input for a mailto URL", () => {
    expect(resolveReportUrl({ url: "mailto:hola@ejemplo.com" })).toEqual({
      status: "empty",
      input: "mailto:hola@ejemplo.com",
    });
  });
});
