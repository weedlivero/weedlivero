import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { createAdminSession } from '@/lib/admin-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(data, status) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variabili Supabase mancanti');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return json({ success: false, error: 'Origine della richiesta non autorizzata.' }, 403);
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json({ success: false, error: 'Formato richiesta non valido.' }, 415);
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.code !== 'string') {
      return json({ success: false, error: 'Inserisci la password amministratore.' }, 400);
    }
    const code = body.code.trim();
    if (!code || code.length > 256) {
      return json({ success: false, error: 'Password amministratore non valida.' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const { data: settings, error } = await supabase
      .from('settings')
      .select('admin_password_hash')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Errore lettura impostazioni:', error);
      return json({ success: false, error: 'Impossibile verificare la password.' }, 500);
    }
    if (!settings?.admin_password_hash) {
      console.error('Hash password amministratore non configurato');
      return json({ success: false, error: 'Autenticazione amministratore non configurata.' }, 503);
    }

    const passwordIsValid = await bcrypt.compare(code, settings.admin_password_hash);
    if (!passwordIsValid) {
      return json({ success: false, error: 'Password amministratore errata.' }, 401);
    }

    await createAdminSession();
    return json({ success: true }, 200);
  } catch (error) {
    console.error('Errore login amministratore:', error);
    return json({ success: false, error: 'Errore interno durante il login.' }, 500);
  }
}
