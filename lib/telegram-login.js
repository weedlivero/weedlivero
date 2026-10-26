
import 'server-only';

import {
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

const MAX_AUTH_AGE_SECONDS = 300;

export function verifyTelegramLogin(payload) {
  const botToken = process.env.TELEGRAM_VERIFY_BOT_TOKEN;

  if (!botToken) {
    throw new Error('Token Telegram non configurato');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const allowedFields = new Set([
    'id',
    'first_name',
    'last_name',
    'username',
    'photo_url',
    'auth_date',
    'hash',
  ]);

  const entries = Object.entries(payload);

  if (
    entries.some(
      ([key, value]) =>
        !allowedFields.has(key) ||
        typeof value !== 'string' && typeof value !== 'number'
    )
  ) {
    return null;
  }

  const hash = payload.hash;

  if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/i.test(hash)) {
    return null;
  }

  const authDate = Number(payload.auth_date);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isSafeInteger(authDate) ||
    authDate > now + 30 ||
    now - authDate > MAX_AUTH_AGE_SECONDS
  ) {
    return null;
  }

  const telegramId = String(payload.id ?? '');

  if (!/^[1-9][0-9]*$/.test(telegramId)) {
    return null;
  }

  const username = payload.username;

  if (
    typeof username !== 'string' ||
    !/^[A-Za-z0-9_]{5,32}$/.test(username)
  ) {
    return null;
  }

  const dataCheckString = entries
    .filter(([key]) => key !== 'hash')
    .map(([key, value]) => [key, String(value)])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHash('sha256')
    .update(botToken)
    .digest();

  const expectedHash = createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest();

  const receivedHash = Buffer.from(hash, 'hex');

  if (
    receivedHash.length !== expectedHash.length ||
    !timingSafeEqual(receivedHash, expectedHash)
  ) {
    return null;
  }

  return {
    telegramUserId: telegramId,
    telegramUsername: username,
    verifiedAt: new Date(authDate * 1000).toISOString(),
  };
}
