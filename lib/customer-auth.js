import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'weedlivero_customer_session';
const TTL = 60 * 60 * 24 * 7;

export function customerDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Configurazione Supabase mancante');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function hmacIdentifier(value) {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw) throw new Error('Chiave HMAC mancante');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('Chiave HMAC non valida');
  return createHmac('sha256', key).update(value).digest('hex');
}

export async function customerLimit(db, action, identifier, maxAttempts = 5) {
  const { data, error } = await db.rpc('customer_check_rate_limit', {
    p_action: action,
    p_identifier_hash: hmacIdentifier(identifier),
    p_max_attempts: maxAttempts,
    p_window_seconds: 3600,
  });
  if (error || typeof data !== 'boolean') {
    console.error('Rate limit cliente non disponibile:', {
      errorCode: error?.code || null,
      dataType: typeof data,
      isNull: data === null,
      isArray: Array.isArray(data),
      dataValue: typeof data === 'boolean' ? data : null,
    });
    return null;
  }
  return data;
}

export function trustedClientIp(request) {
  // Proxy MUST overwrite x-forwarded-for; do not enable login before verifying this.
  const raw = request.headers.get('x-forwarded-for');
  const ip = raw?.split(',')[0]?.trim();
  return ip && ip.length <= 64 && /^[0-9a-fA-F:.]+$/.test(ip) ? ip : null;
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function noStore(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function startCustomerSession(db, accountId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL * 1000).toISOString();
  const { error } = await db.from('customer_sessions').insert({
    account_id: accountId,
    token_hash: digest(token),
    expires_at: expiresAt,
  });
  if (error) throw error;
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TTL,
  });
}

export async function getCustomerSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const db = customerDb();
  const { data: session, error } = await db.from('customer_sessions')
    .select('id,account_id,expires_at,revoked_at')
    .eq('token_hash', digest(token)).maybeSingle();
  if (error) throw error;
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return null;
  const { data: account, error: accountError } = await db.from('customer_accounts')
    .select('id,username,approval_status,is_active,must_change_password')
    .eq('id', session.account_id).maybeSingle();
  if (accountError) throw accountError;
  if (!account || account.approval_status !== 'approved' || !account.is_active) return null;
  return { sessionId: session.id, account };
}

export async function endCustomerSession() {
  const token = cookies().get(COOKIE)?.value;
  // Always clear browser cookie even if the database is unavailable.
  cookies().delete(COOKIE);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  const { error } = await customerDb().from('customer_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', digest(token)).is('revoked_at', null);
  if (error) throw error;
}
