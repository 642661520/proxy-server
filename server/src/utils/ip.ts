import { isIP } from 'net';

export function matchIpOrCidr(ip: string, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === ip) return true;

  // CIDR matching
  if (pattern.includes('/')) {
    return ipInCidr(ip, pattern);
  }

  return false;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/');
  const bits = parseInt(bitsStr, 10);

  if (!isIP(ip)) return false;
  if (!isIP(range)) return false;

  const ipBytes = ipToBytes(ip);
  const rangeBytes = ipToBytes(range);

  if (ipBytes.length !== rangeBytes.length) return false;

  const fullBytes = Math.floor(bits / 8);
  const remainBits = bits % 8;

  for (let i = 0; i < fullBytes; i++) {
    if (ipBytes[i] !== rangeBytes[i]) return false;
  }

  if (remainBits > 0) {
    const mask = 0xFF << (8 - remainBits);
    if ((ipBytes[fullBytes] & mask) !== (rangeBytes[fullBytes] & mask)) {
      return false;
    }
  }

  return true;
}

function ipToBytes(ip: string): number[] {
  if (ip.includes('.')) {
    return ip.split('.').map(Number);
  }
  // IPv6: expand :: and convert
  const parts = ip.split(':');
  const bytes: number[] = [];

  // Count non-empty parts to compute how many zero-groups :: represents
  const nonEmptyCount = parts.filter(p => p !== '').length;

  let zeroFilled = false;
  for (const part of parts) {
    if (part === '') {
      if (zeroFilled) continue; // second empty from :: — already filled
      zeroFilled = true;
      const zeroGroups = 8 - nonEmptyCount;
      for (let i = 0; i < zeroGroups; i++) {
        bytes.push(0, 0);
      }
    } else {
      const val = parseInt(part, 16);
      bytes.push((val >> 8) & 0xFF, val & 0xFF);
    }
  }
  // Pad to exactly 16 bytes in case of trailing ::
  while (bytes.length < 16) bytes.push(0);
  return bytes.slice(0, 16);
}
