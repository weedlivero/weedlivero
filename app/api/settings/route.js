import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { verifyAdminSession } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };
}

export async function GET() {
  try {
    if (!(await verifyAdminSession())) {
      return Response.json({ error: 'Accesso amministratore richiesto.' }, { status: 401, headers: noStoreHeaders() });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    /*
     * Non utilizziamo select('*') perchÃ© non dobbiamo mai inviare
     * admin_password_hash al browser.
     */
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select(`
        id,
        catalog_name,
        catalog_url,
        welcome_message,
        catalog_access_code,
        guest_access_enabled,
        telegram_enabled,
        telegram_username,
        telegram_phone,
        signal_enabled,
        signal_phone,
        signal_url,
        whatsapp_phone,
        contact_email,
        popup_enabled,
        popup_title,
        popup_message,
        popup_button_text,
        logo_url,
        primary_color,
        secondary_color,
menu_pdf_mode,
menu_pdf_path,
menu_pdf_name,
updated_at
      `)
      .eq('id', 1)
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        settings: data,
      },
      {
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error('Errore caricamento impostazioni:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore caricamento impostazioni',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: 'Origine richiesta non autorizzata.' }, { status: 403, headers: noStoreHeaders() });
    }
    if (!(await verifyAdminSession())) {
      return Response.json({ error: 'Accesso amministratore richiesto.' }, { status: 401, headers: noStoreHeaders() });
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const body = await request.json();

    const catalogAccessCode =
      typeof body.catalog_access_code === 'string'
        ? body.catalog_access_code.trim()
        : null;

    const currentAdminPassword =
      typeof body.current_admin_password === 'string'
        ? body.current_admin_password
        : '';

    const newAdminPassword =
      typeof body.new_admin_password === 'string'
        ? body.new_admin_password
        : '';

    const confirmAdminPassword =
      typeof body.confirm_admin_password === 'string'
        ? body.confirm_admin_password
        : '';

    /*
     * Manteniamo tutte le impostazioni giÃ  presenti.
     */
    const updates = {
      catalog_name: body.catalog_name ?? '',
      catalog_url: body.catalog_url ?? '',
      welcome_message: body.welcome_message ?? '',
      telegram_enabled: body.telegram_enabled === true,
      telegram_username: body.telegram_username ?? '',
      telegram_phone: body.telegram_phone ?? '',

      signal_enabled: body.signal_enabled === true,
      signal_phone: body.signal_phone ?? '',
      signal_url: body.signal_url ?? '',

      whatsapp_phone: body.whatsapp_phone ?? '',
      contact_email: body.contact_email ?? '',

      popup_enabled: body.popup_enabled === true,
      popup_title: body.popup_title ?? '',
      popup_message: body.popup_message ?? '',
      popup_button_text:
        body.popup_button_text?.trim() || 'Ho capito',

      logo_url: body.logo_url ?? '',
      primary_color: body.primary_color ?? 'green',
      secondary_color: body.secondary_color ?? 'emerald',

      updated_at: new Date().toISOString(),
    };
    if (
  body.menu_pdf_mode === 'manual' ||
  body.menu_pdf_mode === 'automatic'
) {
  updates.menu_pdf_mode = body.menu_pdf_mode;
}

if (typeof body.menu_pdf_path === 'string') {
  updates.menu_pdf_path = body.menu_pdf_path;
}

if (typeof body.menu_pdf_name === 'string') {
  updates.menu_pdf_name = body.menu_pdf_name;
}

    /*
     * Aggiorna il codice del catalogo solamente quando viene inviato.
     * In questo modo non viene cancellato dalle vecchie versioni
     * della pagina Impostazioni.
     */
    if (catalogAccessCode !== null) {
      if (catalogAccessCode.length < 4) {
        return Response.json(
          {
            error:
              'Il codice di accesso al catalogo deve contenere almeno 4 caratteri.',
          },
          { status: 400 }
        );
      }

      if (catalogAccessCode.length > 100) {
        return Response.json(
          {
            error:
              'Il codice di accesso al catalogo Ã¨ troppo lungo.',
          },
          { status: 400 }
        );
      }

      updates.catalog_access_code = catalogAccessCode;
    }

    /*
     * Cambio password amministratore.
     * Viene eseguito solo se Ã¨ stata inserita una nuova password.
     */
    if (newAdminPassword) {
      if (!currentAdminPassword) {
        return Response.json(
          {
            error:
              'Inserisci la password amministratore attuale.',
          },
          { status: 400 }
        );
      }

      if (newAdminPassword.length < 8) {
        return Response.json(
          {
            error:
              'La nuova password deve contenere almeno 8 caratteri.',
          },
          { status: 400 }
        );
      }

      if (newAdminPassword.length > 100) {
        return Response.json(
          {
            error: 'La nuova password Ã¨ troppo lunga.',
          },
          { status: 400 }
        );
      }

      if (newAdminPassword !== confirmAdminPassword) {
        return Response.json(
          {
            error:
              'La nuova password e la conferma non coincidono.',
          },
          { status: 400 }
        );
      }

      if (newAdminPassword === currentAdminPassword) {
        return Response.json(
          {
            error:
              'La nuova password deve essere diversa da quella attuale.',
          },
          { status: 400 }
        );
      }

      const { data: securitySettings, error: securityError } =
        await supabaseAdmin
          .from('settings')
          .select('admin_password_hash')
          .eq('id', 1)
          .single();

      if (securityError) {
        console.error(
          'Errore lettura sicurezza:',
          securityError
        );

        return Response.json(
          {
            error:
              'Impossibile verificare la password attuale.',
          },
          { status: 500 }
        );
      }

      if (!securitySettings?.admin_password_hash) {
        return Response.json(
          {
            error:
              'Password amministratore non configurata nel database.',
          },
          { status: 500 }
        );
      }

      const currentPasswordIsValid = await bcrypt.compare(
        currentAdminPassword,
        securitySettings.admin_password_hash
      );

      if (!currentPasswordIsValid) {
        return Response.json(
          {
            error:
              'La password amministratore attuale non Ã¨ corretta.',
          },
          { status: 401 }
        );
      }

      updates.admin_password_hash = await bcrypt.hash(
        newAdminPassword,
        12
      );
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select(`
        id,
        catalog_name,
        catalog_url,
        welcome_message,
        catalog_access_code,
        guest_access_enabled,
        telegram_enabled,
        telegram_username,
        telegram_phone,
        signal_enabled,
        signal_phone,
        signal_url,
        whatsapp_phone,
        contact_email,
        popup_enabled,
        popup_title,
        popup_message,
        popup_button_text,
        logo_url,
primary_color,
secondary_color,
menu_pdf_mode,
menu_pdf_path,
menu_pdf_name,
updated_at
      `)
      .single();

    if (error) {
      console.error('Errore salvataggio impostazioni:', error);

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        settings: data,
        password_changed: Boolean(newAdminPassword),
      },
      {
        headers: noStoreHeaders(),
      }
    );
  } catch (error) {
    console.error('Errore salvataggio impostazioni:', error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore salvataggio impostazioni',
      },
      { status: 500 }
    );
  }
}
// Aggiornamento indipendente della sola autorizzazione ospiti.
export async function PUT(request) {
  const headers = noStoreHeaders();
  try {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: 'Origine richiesta non autorizzata.' }, { status: 403, headers });
    }
    if (!(await verifyAdminSession())) {
      return Response.json({ error: 'Accesso amministratore richiesto.' }, { status: 401, headers });
    }
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return Response.json({ error: 'Formato richiesta non valido.' }, { status: 415, headers });
    }
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > 1024) {
      return Response.json({ error: 'Richiesta troppo grande.' }, { status: 413, headers });
    }
    let body;
    try { body = JSON.parse(raw); } catch {
      return Response.json({ error: 'JSON non valido.' }, { status: 400, headers });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 1 || typeof body.guest_access_enabled !== 'boolean') {
      return Response.json({ error: 'Impostazione ospiti non valida.' }, { status: 400, headers });
    }
    const db = getSupabaseAdmin();
    if (!db) return Response.json({ error: 'Configurazione Supabase mancante.' }, { status: 500, headers });
    const { data, error } = await db.from('settings')
      .update({ guest_access_enabled: body.guest_access_enabled })
      .eq('id', 1)
      .select('guest_access_enabled')
      .single();
    if (error) throw error;
    return Response.json({ success: true, guest_access_enabled: data.guest_access_enabled === true }, { headers });
  } catch (error) {
    console.error('Salvataggio accesso ospiti:', error?.code || error?.message);
    return Response.json({ error: 'Impossibile aggiornare accesso ospiti.' }, { status: 500, headers });
  }
}