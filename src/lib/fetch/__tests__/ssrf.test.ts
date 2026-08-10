import { describe, expect, it } from "vitest";
import {
  assertPublicHost,
  classifyIp,
  isPrivateIp,
  SsrfError,
} from "@/lib/fetch/ssrf";
import type { IpClassification, LookupFn } from "@/lib/fetch/ssrf";

const ipv4Matrix: Array<[string, IpClassification]> = [
  // loopback 127/8 (D6)
  ["127.0.0.1", "loopback"],
  ["127.255.255.254", "loopback"],
  // link-local 169.254/16 incl. cloud metadata (D6)
  ["169.254.169.254", "link_local_reserved"],
  ["169.254.0.1", "link_local_reserved"],
  // private 10/8 (D6)
  ["10.0.0.1", "private_ip_range"],
  ["10.255.255.255", "private_ip_range"],
  // private 192.168/16 (D6)
  ["192.168.1.1", "private_ip_range"],
  // private 172.16/12 (D6) — exact bounds
  ["172.16.0.1", "private_ip_range"],
  ["172.31.255.255", "private_ip_range"],
  ["172.32.0.1", "public"],
  // CGNAT 100.64/10 (D6) — exact bounds
  ["100.64.0.1", "cg_nat"],
  ["100.127.255.254", "cg_nat"],
  ["100.128.0.1", "public"],
  // public
  ["93.184.216.34", "public"],
  ["8.8.8.8", "public"],
];

const ipv6Matrix: Array<[string, IpClassification]> = [
  // loopback ::1 (D6)
  ["::1", "loopback"],
  // unique-local fc00::/7 (D6)
  ["fc00::1", "unique_local"],
  ["fd00::1", "unique_local"],
  // link-local fe80::/10 (D6)
  ["fe80::1", "link_local_reserved"],
  ["febf:ffff::1", "link_local_reserved"],
  // public
  ["2606:2800:220:1:248:1893:25c8:1946", "public"],
  // IPv4-mapped IPv6 must not bypass the IPv4 rules (SSRF bypass defense)
  ["::ffff:127.0.0.1", "loopback"],
  ["::ffff:10.0.0.1", "private_ip_range"],
];

describe("classifyIp (D6 range matrix)", () => {
  for (const [ip, expected] of ipv4Matrix) {
    it(`classifies IPv4 ${ip} as ${expected}`, () => {
      expect(classifyIp(ip)).toBe(expected);
    });
  }
  for (const [ip, expected] of ipv6Matrix) {
    it(`classifies IPv6 ${ip} as ${expected}`, () => {
      expect(classifyIp(ip)).toBe(expected);
    });
  }
  it("classifies malformed input as reserved", () => {
    expect(classifyIp("not-an-ip")).toBe("reserved");
  });
});

describe("isPrivateIp", () => {
  it("returns true exactly for non-public matrix entries", () => {
    for (const [ip, classification] of [...ipv4Matrix, ...ipv6Matrix]) {
      expect(isPrivateIp(ip)).toBe(classification !== "public");
    }
  });
});

describe("assertPublicHost (RFL-2 DNS-resolve guard)", () => {
  it("passes when the hostname resolves to a public IP", async () => {
    const lookup: LookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
    ];
    await expect(
      assertPublicHost("example.com", lookup),
    ).resolves.toBeUndefined();
  });

  it("passes when every resolved address is public (A + AAAA)", async () => {
    const lookup: LookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 },
    ];
    await expect(
      assertPublicHost("dual-stack.test", lookup),
    ).resolves.toBeUndefined();
  });

  it("rejects 127.0.0.1 with an SsrfError carrying ip and classification", async () => {
    const lookup: LookupFn = async () => [{ address: "127.0.0.1", family: 4 }];
    const error = await assertPublicHost("internal.test", lookup).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(SsrfError);
    if (error instanceof SsrfError) {
      expect(error.ip).toBe("127.0.0.1");
      expect(error.classification).toBe("loopback");
      expect(error.message).toContain("internal.test");
    }
  });

  it("rejects when ANY resolved address is private, reporting that address", async () => {
    const lookup: LookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "fc00::1", family: 6 },
    ];
    const error = await assertPublicHost("mixed.test", lookup).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(SsrfError);
    if (error instanceof SsrfError) {
      expect(error.ip).toBe("fc00::1");
      expect(error.classification).toBe("unique_local");
    }
  });
});
