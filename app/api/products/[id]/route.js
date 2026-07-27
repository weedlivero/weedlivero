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
export async function GET(request, { params }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const productId = params.id;

    if (!productId) {
      return Response.json(
        { error: 'Codice prodotto mancante' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      return Response.json(
        { error: error.message },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return Response.json(
      {
        product: data,
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
            : 'Errore durante il caricamento del prodotto',
      },
      { status: 500 }
    );
  }
}
export async function PATCH(request, { params }) {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const productId = params.id;

    if (!productId) {
      return Response.json(
        { error: 'Codice prodotto mancante' },
        { status: 400 }
      );
    }

    const updates = {
      name: String(body.name ?? '').trim(),
      brand: String(body.brand ?? '').trim(),
      category: String(body.category ?? '').trim(),
      description: String(body.description ?? '').trim(),
      image_url: body.image_url ?? '',
      image_path: body.image_path ?? '',
      video_url: body.video_url ?? '',
      video_path: body.video_path ?? '',
      thc: String(body.thc ?? '').trim(),
      cbd: String(body.cbd ?? '').trim(),
      active: body.active === true,
      featured: body.featured === true,
      
    };

    if (!updates.name) {
      return Response.json(
        { error: 'Nome prodotto obbligatorio' },
        { status: 400 }
      );
    }

    if (!updates.category) {
      return Response.json(
        { error: 'Categoria prodotto obbligatoria' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', productId)
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
        product: data,
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
            : 'Errore durante l’aggiornamento del prodotto',
      },
      { status: 500 }
    );
  }
}