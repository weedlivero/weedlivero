
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return Response.json(
        { error: 'Configurazione non disponibile' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase
      .from('settings')
      .select(`
        catalog_name,
        catalog_url,
        guest_access_enabled,
        telegram_enabled,
        telegram_username,
        signal_enabled,
        signal_phone,
        signal_url
      `)
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Errore impostazioni pubbliche:', error);
      return Response.json(
        { error: 'Impostazioni non disponibili' },
        { status: 500 }
      );
    }

    return Response.json(
      { settings: data },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('Errore API pubblica:', error);

    return Response.json(
      { error: 'Errore interno' },
      { status: 500 }
    );
  }
}
