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

const IPV4_MAX = 0xffffffff;

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

function ipv6ToBigInt(ip: string): bigint | null {
  let head = ip;
  let v4: number[] | null = null;

  const v4Match = ip.match(/^(.*?):(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4Match) {
    head = v4Match[1];
    v4 = [
      Number(v4Match[2]),
      Number(v4Match[3]),
      Number(v4Match[4]),
      Number(v4Match[5]),
    ];
    if (v4.some((octet) => octet > 255)) return null;
  }

  const splitGroups = (part: string): string[] =>
    part === "" ? [] : part.split(":");
  const doubleColon = head.indexOf("::");
  let left: string[];
  let right: string[];
  if (doubleColon === -1) {
    left = splitGroups(head);
    right = [];
  } else {
    left = splitGroups(head.slice(0, doubleColon));
    right = splitGroups(head.slice(doubleColon + 2));
  }

  const parseGroup = (group: string): number => {
    if (!/^[0-9a-fA-F]{1,4}$/.test(group)) return NaN;
    return parseInt(group, 16);
  };
  const leftValues = left.map(parseGroup);
  const rightValues = right.map(parseGroup);
  if (leftValues.some(Number.isNaN) || rightValues.some(Number.isNaN))
    return null;

  const total = leftValues.length + rightValues.length + (v4 ? 2 : 0);
  if (doubleColon === -1 && total !== 8) return null;
  if (doubleColon !== -1 && total > 8) return null;

  const groups: number[] = [...leftValues];
  for (let i = 0; i < 8 - total; i++) groups.push(0);
  groups.push(...rightValues);
  if (v4) {
    groups.push((v4[0] << 8) | v4[1]);
    groups.push((v4[2] << 8) | v4[3]);
  }

  let value = 0n;
  for (const group of groups) value = (value << 16n) | BigInt(group);
  return value;
}

function ipv6MappedToIpv4(value: bigint): string {
  const low = Number(value & BigInt(IPV4_MAX));
  return `${(low >>> 24) & 0xff}.${(low >>> 16) & 0xff}.${(low >>> 8) & 0xff}.${low & 0xff}`;
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
    const value = ipv6ToBigInt(ip);
    if (value === null) return "reserved";
    if (value === 1n) return "loopback"; // ::1
    if (value >> 121n === 0x7en) return "unique_local"; // fc00::/7
    if (value >> 118n === 0x3fan) return "link_local_reserved"; // fe80::/10
    if (value >> 32n === 0xffffn) return classifyIp(ipv6MappedToIpv4(value)); // ::ffff:0:0/96
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
