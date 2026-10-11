
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const INTENT_DURATION = '15m';
const INTENT_ISSUER = 'weedlivero';
const INTENT_AUDIENCE = 'menu-pdf-upload';

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

export async function createMenuUploadIntent({
  storagePath,
  fileName,
  fileSize,
}) {
  return new SignJWT({
    storagePath,
    fileName,
    fileSize,
    purpose: 'menu-pdf-upload',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(INTENT_ISSUER)
    .setAudience(INTENT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(INTENT_DURATION)
    .sign(getSecret());
}

export async function verifyMenuUploadIntent(token) {
  if (typeof token !== 'string' || !token) {
    throw new Error('Autorizzazione upload mancante');
  }

  const { payload } = await jwtVerify(
    token,
    getSecret(),
    {
      algorithms: ['HS256'],
      issuer: INTENT_ISSUER,
      audience: INTENT_AUDIENCE,
    }
  );

  if (
    payload.purpose !== 'menu-pdf-upload' ||
    typeof payload.storagePath !== 'string' ||
    !/^uploads\/[0-9a-f-]{36}\.pdf$/.test(
      payload.storagePath
    ) ||
    typeof payload.fileName !== 'string' ||
    typeof payload.fileSize !== 'number' ||
    !Number.isSafeInteger(payload.fileSize) ||
    payload.fileSize <= 0 ||
    payload.fileSize > 20 * 1024 * 1024
  ) {
    throw new Error('Autorizzazione upload non valida');
  }

  return {
    storagePath: payload.storagePath,
    fileName: payload.fileName,
    fileSize: payload.fileSize,
  };
}
