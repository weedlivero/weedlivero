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

// Campi per il catalogo. I percorsi privati sono usati solo per firmare i media sul server.
const protectedCatalogFields = 'id,name,brand,category,description,notes,image_url,image_path,video_url,video_path,thc,cbd,quality_level,price_unit,price_1g,price_3g,price_5g,price_10g,price_20g,price_50g,price_100g,price_promo,menu_order,active,featured,sold_out,created_at';

function publicCatalogProduct(product) {
  if (!product) return product;
  const { image_path, video_path, ...safeProduct } = product;
  return safeProduct;
}

export async function getProducts(categorySlug) {
  if (!hasSupabaseConfig) {
    const activeProducts = demoProducts.filter((p) => p.active !== false);
    return categorySlug
      ? activeProducts.filter((p) => p.category === categorySlug)
      : activeProducts;
  }

  const protectedMode = process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true';
  const db = protectedMode ? getSupabaseAdmin() : supabase;
  if (!db) return [];

  let query = db
    .from('products')
    .select(protectedMode ? protectedCatalogFields : '*')
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (categorySlug) query = query.eq('category', categorySlug);

  const { data, error } = await query;
  if (error) return [];

  const products = await Promise.all((data || []).map(attachSignedMedia));
  return protectedMode ? products.map(publicCatalogProduct) : products;
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

  const protectedMode = process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true';
  const db = protectedMode ? getSupabaseAdmin() : supabase;
  if (!db) return null;

  const { data, error } = await db
    .from('products')
    .select(protectedMode ? protectedCatalogFields : '*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error) return null;

  const product = await attachSignedMedia(data);
  return protectedMode ? publicCatalogProduct(product) : product;
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