
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'weedlivero_admin_session';
const SESSION_DURATION = 60 * 60 * 8;

function getSecret() {
  const value = process.env.ADMIN_SESSION_SECRET;

  if (!value) {
    throw new Error('ADMIN_SESSION_SECRET mancante');
  }

  const secret = Buffer.from(value, 'base64');

  if (secret.length !== 32) {
    throw new Error('ADMIN_SESSION_SECRET non valida');
  }

  return new Uint8Array(secret);
}

export async function createAdminSession() {
  const token = await new SignJWT({
    role: 'admin',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION,
  });
}

export async function verifyAdminSession() {
  const token = cookies().get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });

    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function clearAdminSession() {
  cookies().delete(COOKIE_NAME);
}
