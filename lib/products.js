import { createClient } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { demoProducts } from '@/data/demoProducts';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey);
}

async function attachSignedMedia(product) {
  if (!product) return product;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return product;

  const updatedProduct = { ...product };

  if (product.image_path) {
    const { data } = await supabaseAdmin.storage
      .from('product-media')
      .createSignedUrl(product.image_path, 3600);

    if (data?.signedUrl) updatedProduct.image_url = data.signedUrl;
  }

  if (product.video_path) {
    const { data } = await supabaseAdmin.storage
      .from('product-media')
      .createSignedUrl(product.video_path, 3600);

    if (data?.signedUrl) updatedProduct.video_url = data.signedUrl;
  }

  return updatedProduct;
}

export async function getProducts(categorySlug) {
  if (!hasSupabaseConfig) {
    const activeProducts = demoProducts.filter((p) => p.active !== false);
    return categorySlug
      ? activeProducts.filter((p) => p.category === categorySlug)
      : activeProducts;
  }

  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) query = query.eq('category', categorySlug);

  const { data, error } = await query;
  if (error) return [];

  return Promise.all((data || []).map(attachSignedMedia));
}

export async function getAdminProducts() {
  if (!hasSupabaseConfig) return demoProducts;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return [];

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];

  return Promise.all((data || []).map(attachSignedMedia));
}

export async function getProduct(id) {
  if (!hasSupabaseConfig) {
    return demoProducts.find((p) => p.id === id && p.active !== false) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error) return null;

  return attachSignedMedia(data);
}

export async function getAdminProduct(id) {
  if (!hasSupabaseConfig) {
    return demoProducts.find((p) => p.id === id) || null;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;

  return attachSignedMedia(data);
}