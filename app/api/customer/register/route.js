import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

export async function POST(request) {
  // Closed until the Telegram verification flow and durable rate limits are ready.
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

    const supabase = getAdminClient();
    if (!supabase) return response({ error: 'Configurazione non disponibile.' }, 503);

    const passwordHash = await bcrypt.hash(password, 12);
    const { error } = await supabase.from('customer_accounts').insert({
      username,
      password_hash: passwordHash,
      is_active: false,
      must_change_password: false,
    });

    if (error) {
      if (error.code === '23505') {
        return response({ error: 'Username non disponibile.' }, 409);
      }
      console.error('Registrazione cliente:', error.code);
      return response({ error: 'Impossibile completare la registrazione.' }, 500);
    }

    return response({ success: true, message: 'Account creato in attesa di verifica Telegram.' }, 201);
  } catch (error) {
    if (error instanceof SyntaxError) return response({ error: 'JSON non valido.' }, 400);
    console.error('Errore registrazione:', error);
    return response({ error: 'Errore interno.' }, 500);
  }
}
