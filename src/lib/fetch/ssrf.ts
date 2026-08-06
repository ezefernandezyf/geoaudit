import dns from "node:dns";
import net from "node:net";

/**
 * SSRF guard (RFL-2/RFL-3). Resolves a hostname via DNS and rejects any
 * resolved address inside the D6 private/link-local/reserved ranges.
 * Pure classification functions keep the range matrix unit-testable without DNS.
 */

export type IpClassification =
  | "public"
  | "loopback"
  | "private_ip_range"
  | "link_local_reserved"
  | "cg_nat"
  | "unique_local"
  | "reserved";

export interface LookupAddress {
  address: string;
  family: number;
}

export type LookupFn = (hostname: string) => Promise<LookupAddress[]>;

const defaultLookup: LookupFn = (hostname) =>
  dns.promises.lookup(hostname, { all: true, family: 0 });

export class SsrfError extends Error {
  constructor(
    readonly hostname: string,
    readonly ip: string,
    readonly classification: IpClassification,
  ) {
    super(`SSRF blocked: ${hostname} resolves to ${ip} (${classification})`);
    this.name = "SsrfError";
  }
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8) | octet;
  }
  return value >>> 0;
}

/**
 * Classify a single IP string against the D6 ranges:
 * private 10/8, 172.16/12, 192.168/16; loopback 127/8; link-local 169.254/16
 * (incl. 169.254.169.254); CGNAT 100.64/10; IPv6 ::1, fc00::/7, fe80::/10.
 * IPv4-mapped IPv6 (::ffff:a.b.c.d) is re-classified as its IPv4 address.
 */
export function classifyIp(ip: string): IpClassification {
  const family = net.isIP(ip);

  if (family === 4) {
    const value = ipv4ToInt(ip);
    if (value === null) return "reserved";
    // Unsigned right-shift comparisons avoid JS signed-32-bit bitwise traps.
    if (value >>> 24 === 0x7f) return "loopback"; // 127/8
    if (value >>> 16 === 0xa9fe) return "link_local_reserved"; // 169.254/16
    if (value >>> 24 === 0x0a) return "private_ip_range"; // 10/8
    if (value >>> 20 === 0xac1) return "private_ip_range"; // 172.16/12
    if (value >>> 16 === 0xc0a8) return "private_ip_range"; // 192.168/16
    if (value >>> 22 === 0x191) return "cg_nat"; // 100.64/10
    return "public";
  }

  if (family === 6) {
    const lower = ip.toLowerCase();
    // IPv4-mapped IPv6 must not bypass the IPv4 range rules (D6 bypass defense).
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return classifyIp(mapped[1]);
    if (lower === "::1") return "loopback"; // ::1
    const firstHextet = lower.split(":")[0];
    if (firstHextet.startsWith("fc") || firstHextet.startsWith("fd")) {
      return "unique_local"; // fc00::/7
    }
    if (/^fe[89ab]/.test(firstHextet)) {
      return "link_local_reserved"; // fe80::/10 (fe80-febf)
    }
    return "public";
  }

  return "reserved";
}

export function isPrivateIp(ip: string): boolean {
  return classifyIp(ip) !== "public";
}

/**
 * Resolve `hostname` and require every resolved address to be public.
 * Throws {@link SsrfError} on the first blocked address; DNS failures from the
 * lookup propagate to the caller (mapped to typed FetchError codes upstream).
 */
export async function assertPublicHost(
  hostname: string,
  lookup: LookupFn = defaultLookup,
): Promise<void> {
  const addresses = await lookup(hostname);
  for (const { address } of addresses) {
    const classification = classifyIp(address);
    if (classification !== "public") {
      throw new SsrfError(hostname, address, classification);
    }
  }
}
