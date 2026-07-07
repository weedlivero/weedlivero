import { createClient } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { demoProducts } from '@/data/demoProducts';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('SUPABASE URL PRESENTE:', Boolean(supabaseUrl));
  console.log('SERVICE ROLE PRESENTE:', Boolean(serviceRoleKey));

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey);
}

async function attachSignedMedia(product) {
  if (!product) return product;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return product;

  const updatedProduct = { ...product };

  if (product.image_path) {
    console.log('PRODUCT ID:', product.id);
    console.log('IMAGE PATH:', product.image_path);

    const { data, error } = await supabaseAdmin.storage
      .from('product-media')
      .createSignedUrl(product.image_path, 3600);

    console.log('SIGNED IMAGE URL:', data?.signedUrl);
    console.log('SIGNED IMAGE ERROR:', error);

    if (data?.signedUrl) {
      updatedProduct.image_url = data.signedUrl;
    }
  } else {
    console.log('NESSUN IMAGE_PATH PER:', product.id);
  }

  return updatedProduct;
}

export async function getProducts(categorySlug) {
  if (!hasSupabaseConfig) {
    const activeProducts = demoProducts.filter(
      (product) => product.active !== false
    );

    return categorySlug
      ? activeProducts.filter((product) => product.category === categorySlug)
      : activeProducts;
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) {
    query = query.eq('category', categorySlug);
  }

  const { data, error } = await query;

  if (error) {
    console.error('ERRORE CARICAMENTO PRODOTTI:', error);
    return [];
  }

  return Promise.all((data || []).map(attachSignedMedia));
}

export async function getProduct(id) {
  if (!hasSupabaseConfig) {
    return (
      demoProducts.find(
        (product) => product.id === id && product.active !== false
      ) || null
    );
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error) {
    console.error('ERRORE CARICAMENTO PRODOTTO:', error);
    return null;
  }

  return attachSignedMedia(data);
}