import bcrypt from 'bcryptjs';
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

export async function POST(request) {
  if (process.env.CUSTOMER_REGISTRATION_ENABLED !== 'true') {
    return noStore({ error: 'Registrazione non ancora disponibile.' }, 503);
  }

  if (!isSameOrigin(request)) {
    return noStore({ error: 'Origine non autorizzata.' }, 403);
  }

  if (!(request.headers.get('content-type') || '')
    .toLowerCase().startsWith('application/json')) {
    return noStore({ error: 'Formato richiesta non valido.' }, 415);
  }

  try {
    const ip = trustedClientIp(request);
    if (!ip) {
      return noStore({ error: 'Impossibile verificare la richiesta.' }, 503);
    }

    const db = customerDb();

    const ipAllowed = await customerLimit(
      db, 'customer_register_ip', ip, 5
    );

    if (ipAllowed === null) {
      return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    }
    if (!ipAllowed) {
      return noStore({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);
    }

    const raw = await request.text();
    if (raw.length > 4096) {
      return noStore({ error: 'Richiesta troppo grande.' }, 413);
    }

    const body = JSON.parse(raw);

    const verificationToken =
      typeof body?.verificationToken === 'string'
        ? body.verificationToken
        : '';

    const password =
      typeof body?.password === 'string'
        ? body.password
        : '';

    if (!/^[a-f0-9]{64}$/.test(verificationToken)) {
      return noStore({ error: 'Verifica Telegram richiesta.' }, 400);
    }

    if (password.length < 8 || password.length > 128) {
      return noStore({
        error: 'La password deve contenere da 8 a 128 caratteri.',
      }, 400);
    }

    const tokenHash = createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const tokenAllowed = await customerLimit(
      db, 'customer_register_token', tokenHash, 5
    );

    if (tokenAllowed === null) {
      return noStore({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    }
    if (!tokenAllowed) {
      return noStore({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: accountId, error } = await db.rpc(
      'customer_register_with_telegram',
      {
        p_token_hash: tokenHash,
        p_password_hash: passwordHash,
      }
    );

    if (error) {
      if (error.code === '23505') {
        return noStore({
          error: 'Account Telegram o username già registrato.',
        }, 409);
      }

      if (error.code === 'P0001') {
        return noStore({
          error: 'Verifica Telegram non valida, scaduta o già utilizzata.',
        }, 400);
      }

      console.error('Registrazione Telegram:', error.code);
      return noStore({
        error: 'Impossibile completare la registrazione.',
      }, 500);
    }

    if (!accountId) {
      return noStore({
        error: 'Registrazione non completata.',
      }, 500);
    }

    return noStore({
      success: true,
      message: 'Account creato. Ora puoi accedere.',
    }, 201);

  } catch (error) {
    if (error instanceof SyntaxError) {
      return noStore({ error: 'JSON non valido.' }, 400);
    }

    console.error('Errore registrazione Telegram:', error?.code || error?.message);
    return noStore({ error: 'Errore interno.' }, 500);
  }
}
