import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey
  );
}

export async function GET(
  request,
  { params }
) {
  const supabaseAdmin =
    getSupabaseAdmin();

  if (!supabaseAdmin) {
    return new Response(
      'Configurazione Supabase mancante',
      {
        status: 500,
      }
    );
  }

  const productId = params.id;

  const { data: product, error } =
    await supabaseAdmin
      .from('products')
      .select('image_path')
      .eq('id', productId)
      .eq('active', true)
      .single();

  if (
    error ||
    !product ||
    !product.image_path
  ) {
    return new Response(
      'Immagine non trovata',
      {
        status: 404,
      }
    );
  }

  const { data, error: imageError } =
    await supabaseAdmin.storage
      .from('product-media')
      .download(product.image_path);

  if (imageError || !data) {
    return new Response(
      'Impossibile caricare immagine',
      {
        status: 404,
      }
    );
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type':
        data.type ||
        'application/octet-stream',

      'Cache-Control':
        'private, max-age=300',
    },
  });
}