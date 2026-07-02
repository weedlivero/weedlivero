import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { demoProducts } from '@/data/demoProducts';

export async function getProducts(categorySlug) {
  if (!hasSupabaseConfig) {
    return categorySlug ? demoProducts.filter((p) => p.category === categorySlug) : demoProducts;
  }

  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (categorySlug) query = query.eq('category', categorySlug);
  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function getProduct(id) {
  if (!hasSupabaseConfig) return demoProducts.find((p) => p.id === id) || null;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}
