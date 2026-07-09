import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { categories as fallbackCategories } from '@/data/categories';

export async function getCategories() {
  if (!hasSupabaseConfig) {
    return fallbackCategories.sort((a, b) => a.order - b.order);
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Errore caricamento categorie:', error);
    return fallbackCategories.sort((a, b) => a.order - b.order);
  }

  return (data || []).map((category) => ({
    ...category,
    order: category.sort_order,
  }));
}

export async function getActiveCategories() {
  const categories = await getCategories();
  return categories.filter((category) => category.active !== false);
}

export async function getCategoryBySlug(slug) {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) || null;
}