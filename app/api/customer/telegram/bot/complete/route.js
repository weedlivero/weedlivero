import { createHash, randomBytes } from 'node:crypto';
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
      db, 'customer_telegram_bot_complete_ip', ip, 10
    );

    if (allowed === null) {
      return noStore({ error: 'Protezione non disponibile.' }, 503);
    }

    if (!allowed) {
      return noStore({ error: 'Troppi tentativi.' }, 429);
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

    const verificationToken = randomBytes(32).toString('hex');

    const { data, error } = await db.rpc(
      'customer_claim_telegram_bot_verification',
      {
        p_request_hash: sha256(requestCode),
        p_browser_secret_hash: sha256(browserSecret),
        p_token_hash: sha256(verificationToken),
      }
    );

    if (error) {
      console.error('Telegram bot complete:', error.code);
      return noStore({
        error: 'Impossibile completare la verifica.',
      }, 503);
    }

    if (data !== true) {
      return noStore({
        error: 'Verifica non completata, scaduta o già utilizzata.',
      }, 400);
    }

    const { data: identity, error: identityError } = await db
      .from('customer_telegram_verifications')
      .select('telegram_username')
      .eq('token_hash', sha256(verificationToken))
      .eq('purpose', 'registration')
      .is('consumed_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (identityError || !identity) {
      return noStore({
        error: 'Impossibile recuperare lo username Telegram.',
      }, 503);
    }

    return noStore({
      success: true,
      telegramUsername: identity.telegram_username,
      verificationToken,
      expiresAt: new Date(
        Date.now() + 10 * 60 * 1000
      ).toISOString(),
    });

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Telegram bot complete:', error?.code || error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
