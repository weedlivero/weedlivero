'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { demoProducts } from '@/data/demoProducts';
import { categories } from '@/data/categories';
import Header from '@/components/Header';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [form, setForm] = useState({ name: '', brand: '', category: 'weed', description: '', image_url: '' });

  useEffect(() => {
    async function load() {
      if (!hasSupabaseConfig) {
        const product = demoProducts.find((p) => p.id === params.id);
        if (product) setForm(product);
        return;
      }
      const { data } = await supabase.from('products').select('*').eq('id', params.id).single();
      if (data) setForm(data);
    }
    load();
  }, [params.id]);

  async function save(e) {
    e.preventDefault();
    if (hasSupabaseConfig) await supabase.from('products').update(form).eq('id', params.id);
    router.push('/admin');
  }

  async function remove() {
    if (hasSupabaseConfig) await supabase.from('products').delete().eq('id', params.id);
    router.push('/admin');
  }

  return (
    <>
      <Header title="Modifica prodotto" />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
        <form onSubmit={save} className="rounded-[2rem] bg-white p-7 shadow-soft">
          <h1 className="text-3xl font-black">Modifica prodotto</h1>
          <input className="mt-6 w-full rounded-2xl border p-4" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="mt-3 w-full rounded-2xl border p-4" value={form.brand || ''} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <select className="mt-3 w-full rounded-2xl border p-4" value={form.category || 'weed'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
          <textarea className="mt-3 w-full rounded-2xl border p-4" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="mt-3 w-full rounded-2xl border p-4" value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <button className="mt-5 w-full rounded-2xl bg-brand-green p-4 font-bold text-white">Aggiorna</button>
          <button type="button" onClick={remove} className="mt-3 w-full rounded-2xl bg-red-500 p-4 font-bold text-white">Elimina</button>
        </form>
      </main>
    </>
  );
}
