import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { createHmac } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };
const response = (data, status = 200) => Response.json(data, { status, headers });

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hashIdentifier(value) {
  // Reuse the existing private 32-byte admin session secret as HMAC key.
  // This value is never sent to clients or stored in Supabase.
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('Chiave HMAC non configurata');
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32) throw new Error('Chiave HMAC non valida');
  return createHmac('sha256', key).update(value).digest('hex');
}

async function enforceRateLimit(supabase, action, identifier, maxAttempts = 5) {
  const { data, error } = await supabase.rpc('customer_check_rate_limit', {
    p_action: action,
    p_identifier_hash: hashIdentifier(identifier),
    p_max_attempts: maxAttempts,
    p_window_seconds: 3600,
  });
  if (error || typeof data !== 'boolean') {
    console.error('Rate limit non disponibile:', error?.code || 'risposta non valida');
    return { allowed: false, unavailable: true };
  }
  return { allowed: data, unavailable: false };
}

export async function POST(request) {
  // Keep registration CLOSED until customer login, tests and abuse protections are complete.
  if (process.env.CUSTOMER_REGISTRATION_ENABLED !== 'true') {
    return response({ error: 'Registrazione non ancora disponibile.' }, 503);
  }

  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return response({ error: 'Origine non autorizzata.' }, 403);
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return response({ error: 'Formato richiesta non valido.' }, 415);
  }

  try {
    // On deployment, the reverse proxy must overwrite x-forwarded-for.
    // Never trust a user-controlled header unless the proxy is configured accordingly.
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded?.split(',')[0]?.trim();
    if (!clientIp || clientIp.length > 64 || !/^[0-9a-fA-F:.]+$/.test(clientIp)) {
      return response({ error: 'Impossibile verificare la richiesta.' }, 503);
    }

    const supabase = getAdminClient();
    if (!supabase) return response({ error: 'Configurazione non disponibile.' }, 503);

    // Count every registration attempt, including malformed payloads.
    const ipLimit = await enforceRateLimit(supabase, 'customer_register_ip', clientIp);
    if (ipLimit.unavailable) return response({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    if (!ipLimit.allowed) return response({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);

    const raw = await request.text();
    if (raw.length > 4096) return response({ error: 'Richiesta troppo grande.' }, 413);
    const body = JSON.parse(raw);
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      return response({ error: 'Username: 3-32 caratteri, lettere, numeri o underscore.' }, 400);
    }
    if (password.length < 12 || password.length > 128) {
      return response({ error: 'La password deve contenere da 12 a 128 caratteri.' }, 400);
    }

    const usernameLimit = await enforceRateLimit(supabase, 'customer_register_username', username);
    if (usernameLimit.unavailable) return response({ error: 'Protezione temporaneamente non disponibile.' }, 503);
    if (!usernameLimit.allowed) return response({ error: 'Troppi tentativi. Riprova più tardi.' }, 429);

    const passwordHash = await bcrypt.hash(password, 12);
    const { error } = await supabase.from('customer_accounts').insert({
      username,
      password_hash: passwordHash,
      approval_status: 'pending',
      is_active: false,
      must_change_password: false,
    });
    if (error) {
      if (error.code === '23505') return response({ error: 'Username non disponibile.' }, 409);
      console.error('Registrazione cliente:', error.code);
      return response({ error: 'Impossibile completare la registrazione.' }, 500);
    }
    return response({
      success: true,
      message: 'Registrazione ricevuta. Il tuo account e in attesa di approvazione.',
    }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return response({ error: 'JSON non valido.' }, 400);
    console.error('Errore registrazione:', error);
    return response({ error: 'Errore interno.' }, 500);
  }
}
