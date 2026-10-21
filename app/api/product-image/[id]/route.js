import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin-session';
import { getCatalogAccess } from '@/lib/catalog-access';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
  if (process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true') {
    try {
      const isAdmin = await verifyAdminSession();
      if (!isAdmin) {
        const access = await getCatalogAccess();
        if (!access.allowed) {
          return new Response('Accesso al catalogo richiesto.', {
            status: 401,
            headers: { 'Cache-Control': 'no-store' },
          });
        }
      }
    } catch (error) {
      console.error('Verifica accesso immagine fallita:', error);
      return new Response('Verifica accesso non disponibile.', {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }
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