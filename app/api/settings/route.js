import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      { settings: data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
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
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const body = await request.json();

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

      logo_url: body.logo_url ?? '',
      primary_color: body.primary_color ?? 'green',
      secondary_color: body.secondary_color ?? 'emerald',

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: true,
        settings: data,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
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