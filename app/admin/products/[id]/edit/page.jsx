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

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    brand: '',
    category: 'weed',
    description: '',
    image_url: '',
    image_path: '',
    video_url: '',
    video_path: '',
    thc: '',
    cbd: '',
    active: true,
    featured: false,
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function uploadFile(file, folder = 'images') {
    if (!file) return;

    const isVideo = folder === 'videos';

    if (isVideo) setUploadingVideo(true);
    else setUploadingImage(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (isVideo) setUploadingVideo(false);
    else setUploadingImage(false);

    if (!response.ok) {
      alert(result.error || 'Errore upload file');
      return;
    }

    if (isVideo) {
      updateField('video_path', result.path);
      updateField('video_url', '');

      if (hasSupabaseConfig) {
        const { error } = await supabase
          .from('products')
          .update({
            video_path: result.path,
            video_url: '',
          })
          .eq('id', params.id);

        if (error) {
          alert(error.message);
          return;
        }
      }

      alert('Video aggiornato correttamente');
    } else {
      updateField('image_path', result.path);
      updateField('image_url', '');

      if (hasSupabaseConfig) {
        const { error } = await supabase
          .from('products')
          .update({
            image_path: result.path,
            image_url: '',
          })
          .eq('id', params.id);

        if (error) {
          alert(error.message);
          return;
        }
      }

      alert('Immagine aggiornata correttamente');
    }
  }

  useEffect(() => {
    async function load() {
      if (!hasSupabaseConfig) {
        const product = demoProducts.find((p) => p.id === params.id);
        if (product) setForm((current) => ({ ...current, ...product }));
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();

      if (data) setForm((current) => ({ ...current, ...data }));
    }

    load();
  }, [params.id]);

  async function save(e) {
    e.preventDefault();

    if (hasSupabaseConfig) {
      const { error } = await supabase
        .from('products')
        .update(form)
        .eq('id', params.id);

      if (error) {
        alert(error.message);
        return;
      }
    }

    window.location.href = '/admin';
  }

  async function remove() {
    const confirmDelete = window.confirm('Vuoi eliminare questo prodotto?');
    if (!confirmDelete) return;

    const response = await fetch('/api/delete-product', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: params.id,
        image_path: form.image_path,
        video_path: form.video_path,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || 'Errore eliminazione prodotto');
      return;
    }

    window.location.href = '/admin';
  }

  return (
    <>
      <Header title="Modifica prodotto" />

      <main className="mx-auto max-w-4xl px-5 pb-28 pt-8">
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h1 className="text-3xl font-black text-gray-900">
              Modifica prodotto
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Aggiorna le informazioni del prodotto.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Codice prodotto"
                value={form.id || ''}
                disabled
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Nome prodotto"
                value={form.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Brand"
                value={form.brand || ''}
                onChange={(e) => updateField('brand', e.target.value)}
              />

              <select
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                value={form.category || 'weed'}
                onChange={(e) => updateField('category', e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">Media</h2>

            <label className="mt-4 block text-sm font-bold text-gray-700">
              Immagine prodotto
            </label>

            <input
              type="file"
              accept="image/*"
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4"
              onChange={(e) => uploadFile(e.target.files[0], 'images')}
            />

            {uploadingImage ? (
              <p className="mt-3 text-sm font-bold text-gray-500">
                Caricamento immagine...
              </p>
            ) : null}

            {form.image_path ? (
              <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">
                Immagine caricata
              </p>
            ) : null}

            <label className="mt-6 block text-sm font-bold text-gray-700">
              Video breve
            </label>

            <input
              type="file"
              accept="video/*"
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4"
              onChange={(e) => uploadFile(e.target.files[0], 'videos')}
            />

            {uploadingVideo ? (
              <p className="mt-3 text-sm font-bold text-gray-500">
                Caricamento video...
              </p>
            ) : null}

            {form.video_path ? (
              <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">
                Video caricato
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">Dettagli</h2>

            <textarea
              className="mt-5 min-h-32 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="Descrizione prodotto"
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="THC"
                value={form.thc || ''}
                onChange={(e) => updateField('thc', e.target.value)}
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="CBD"
                value={form.cbd || ''}
                onChange={(e) => updateField('cbd', e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Stato prodotto
            </h2>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">Prodotto attivo</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.active)}
                  onChange={(e) => updateField('active', e.target.checked)}
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">In evidenza</span>
                <input
                  type="checkbox"
                  checked={Boolean(form.featured)}
                  onChange={(e) => updateField('featured', e.target.checked)}
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 space-y-3">
            <button
              type="submit"
              className="w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 active:scale-[0.98]"
            >
              Aggiorna prodotto
            </button>

            <button
              type="button"
              onClick={remove}
              className="w-full rounded-2xl bg-red-500 p-4 text-lg font-black text-white shadow-lg shadow-red-200 active:scale-[0.98]"
            >
              Elimina prodotto
            </button>
          </div>
        </form>
      </main>
    </>
  );
}