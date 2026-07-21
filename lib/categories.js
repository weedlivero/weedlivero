import { createClient } from '@supabase/supabase-js';
import { categories as fallbackCategories } from '@/data/categories';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getFallbackCategories() {
  return [...fallbackCategories].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );
}

export async function getCategories() {
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    return getFallbackCategories();
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Errore caricamento categorie:', error);
    return getFallbackCategories();
  }

  if (!data || data.length === 0) {
    return getFallbackCategories();
  }

  return data.map((category) => ({
    ...category,
    order: category.sort_order,
  }));
}

export async function getActiveCategories() {
  const categories = await getCategories();

  return categories.filter(
    (category) => category.active === true
  );
}

export async function getCategoryBySlug(slug) {
  const categories = await getCategories();

  return (
    categories.find((category) => category.slug === slug) || null
  );
}