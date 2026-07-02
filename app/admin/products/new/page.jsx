'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { categories } from '@/data/categories';
import Header from '@/components/Header';

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', brand: '', category: 'weed', description: '', image_url: '' });

  async function save(e) {
    e.preventDefault();
    if (hasSupabaseConfig) await supabase.from('products').insert([form]);
    router.push('/admin');
  }

  return (
    <>
      <Header title="Nuovo prodotto" />
      <main className="mx-auto max-w-2xl px-5 pb-28 pt-8">
        <form onSubmit={save} className="rounded-[2rem] bg-white p-7 shadow-soft">
          <h1 className="text-3xl font-black">Nuovo prodotto</h1>
          <input className="mt-6 w-full rounded-2xl border p-4" placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="mt-3 w-full rounded-2xl border p-4" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <select className="mt-3 w-full rounded-2xl border p-4" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
          <textarea className="mt-3 w-full rounded-2xl border p-4" placeholder="Descrizione" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input className="mt-3 w-full rounded-2xl border p-4" placeholder="URL immagine" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          <button className="mt-5 w-full rounded-2xl bg-brand-green p-4 font-bold text-white">Salva</button>
        </form>
      </main>
    </>
  );
}
