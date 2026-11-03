import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const GUEST_COOKIE = 'weedlivero_guest_entry';
const GUEST_TTL = 60 * 60 * 8;

// Domain-separated key: never issue a token valid for the admin session.
function guestSecret() {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw) throw new Error('ADMIN_SESSION_SECRET mancante');
  const adminKey = Buffer.from(raw, 'base64');
  if (adminKey.length !== 32) throw new Error('ADMIN_SESSION_SECRET non valida');
  return new Uint8Array(createHmac('sha256', adminKey).update('weedlivero:guest-session:v2').digest());
}

function codeFingerprint(code) {
  return createHmac('sha256', guestSecret())
    .update('weedlivero:guest-code:v2:')
    .update(String(code))
    .digest('hex');
}

export function guestCodeMatches(submitted, expected) {
  if (typeof submitted !== 'string' || typeof expected !== 'string' || !expected) return false;
  const a = Buffer.from(codeFingerprint(submitted), 'hex');
  const b = Buffer.from(codeFingerprint(expected), 'hex');
  return timingSafeEqual(a, b);
}

export async function issueGuestSession(code) {
  const token = await new SignJWT({ role: 'guest', version: 2, codeHash: codeFingerprint(code) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${GUEST_TTL}s`)
    .sign(guestSecret());
  return token;
}

export function setGuestCookie(response, token) {
  response.cookies.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_TTL,
  });
}

export async function hasValidGuestSession(currentCode) {
  const token = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!token || token === '1' || token.length > 2048) return false;
  try {
    const { payload } = await jwtVerify(token, guestSecret(), { algorithms: ['HS256'] });
    const expected = codeFingerprint(currentCode);
    const actual = payload.codeHash;
    return payload.role === 'guest' && payload.version === 2 &&
      typeof actual === 'string' && actual.length === expected.length &&
      timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}
