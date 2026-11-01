import { NextResponse } from 'next/server';
import { customerDb, customerLimit, trustedClientIp, isSameOrigin } from '@/lib/customer-auth';
import { guestCodeMatches, issueGuestSession, setGuestCookie } from '@/lib/guest-session';

export const runtime = 'nodejs';

export async function POST(request) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Richiesta non autorizzata.' }, { status: 403, headers });
  }

  let code;
  try {
    const body = await request.json();
    code = body?.code;
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida.' }, { status: 400, headers });
  }
  if (typeof code !== 'string' || !code.trim() || code.length > 128) {
    return NextResponse.json({ error: 'Inserisci la password di accesso.' }, { status: 400, headers });
  }

  try {
    const db = customerDb();
    const ip = trustedClientIp(request);
    // Fail closed if the trusted client IP cannot be determined.
    if (!ip) return NextResponse.json({ error: 'Verifica di sicurezza non disponibile.' }, { status: 503, headers });
    const allowed = await customerLimit(db, 'guest_entry', `guest-entry:${ip}`, 8);
    if (allowed !== true) {
      return NextResponse.json({ error: allowed === false ? 'Troppi tentativi. Riprova più tardi.' : 'Verifica temporaneamente non disponibile.' }, { status: allowed === false ? 429 : 503, headers });
    }

    const { data, error } = await db.from('settings')
      .select('guest_access_enabled,catalog_access_code').eq('id', 1).single();
    if (error || !data) throw error || new Error('Impostazioni mancanti');
    if (data.guest_access_enabled !== true) {
      return NextResponse.json({ error: 'Accesso visitatori disabilitato.' }, { status: 403, headers });
    }
    if (!guestCodeMatches(code.trim(), data.catalog_access_code)) {
      return NextResponse.json({ error: 'Password di accesso non valida.' }, { status: 401, headers });
    }

    const response = NextResponse.json({ ok: true }, { headers });
    setGuestCookie(response, await issueGuestSession(data.catalog_access_code));
    return response;
  } catch (error) {
    console.error('Errore accesso visitatore:', error?.code || error?.message);
    return NextResponse.json({ error: 'Accesso temporaneamente non disponibile.' }, { status: 503, headers });
  }
}
