import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = Buffer.from(await scrypt(password, salt, 64) as ArrayBuffer);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHex, ...extraParts] = storedHash.split(':');
  if (!salt || !expectedHex || extraParts.length || !/^[a-f\d]+$/i.test(expectedHex) || expectedHex.length % 2 !== 0) {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(await scrypt(password, salt, expected.length) as ArrayBuffer);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
