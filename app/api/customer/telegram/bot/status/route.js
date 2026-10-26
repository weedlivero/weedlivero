import { createHash } from 'node:crypto';
import {
  customerDb,
  customerLimit,
  isSameOrigin,
  noStore,
  trustedClientIp,
} from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sha256 = (value) =>
  createHash('sha256').update(value).digest('hex');

export async function POST(request) {
  if (process.env.CUSTOMER_REGISTRATION_ENABLED !== 'true') {
    return noStore({ error: 'Registrazione non disponibile.' }, 503);
  }

  if (!isSameOrigin(request)) {
    return noStore({ error: 'Origine non autorizzata.' }, 403);
  }

  if (!(request.headers.get('content-type') || '')
    .toLowerCase().startsWith('application/json')) {
    return noStore({ error: 'Formato non valido.' }, 415);
  }

  try {
    const ip = trustedClientIp(request);

    if (!ip) {
      return noStore({ error: 'Richiesta non verificabile.' }, 503);
    }

    const db = customerDb();

    const allowed = await customerLimit(
      db, 'customer_telegram_bot_status_ip', ip, 240
    );

    if (allowed === null) {
      return noStore({ error: 'Protezione non disponibile.' }, 503);
    }

    if (!allowed) {
      return noStore({ error: 'Troppi controlli. Riprova più tardi.' }, 429);
    }

    const raw = await request.text();

    if (raw.length > 1024) {
      return noStore({ error: 'Richiesta troppo grande.' }, 413);
    }

    const { requestCode, browserSecret } = JSON.parse(raw);

    if (
      typeof requestCode !== 'string' ||
      !/^[A-Za-z0-9_-]{32}$/.test(requestCode) ||
      typeof browserSecret !== 'string' ||
      !/^[a-f0-9]{64}$/.test(browserSecret)
    ) {
      return noStore({ error: 'Codici non validi.' }, 400);
    }

    const { data, error } = await db
      .from('customer_telegram_bot_requests')
      .select('status, expires_at')
      .eq('request_hash', sha256(requestCode))
      .eq('browser_secret_hash', sha256(browserSecret))
      .maybeSingle();

    if (error) {
      console.error('Telegram bot status:', error.code);
      return noStore({ error: 'Verifica non disponibile.' }, 503);
    }

    if (!data || new Date(data.expires_at).getTime() <= Date.now()) {
      return noStore({ status: 'expired' });
    }

    return noStore({
      status: data.status === 'verified' ? 'verified' : 'pending',
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Telegram bot status:', error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
