'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { categories } from '@/data/categories';
import Header from '@/components/Header';
import ProductPrices from '@/components/admin/ProductPrices';

const initialForm = {
  id: '',
  name: '',
  brand: '',
  category: 'weed',
  description: '',
  notes: '',
  image_url: '',
  image_path: '',
  video_url: '',
  video_path: '',
  thc: '',
  cbd: '',
  quality_level: null,
  price_unit: '',
  price_1g: '',
  price_3g: '',
  price_5g: '',
  price_10g: '',
  price_20g: '',
  price_50g: '',
  price_100g: '',
  price_promo: '',
  menu_order: 0,
  active: true,
  featured: false,
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function readJsonResponse(response) {
    const responseText = await response.text();
    if (!responseText) return {};

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(`Risposta non valida dal server (${response.status})`);
    }
  }

  function prepareProductData(sourceForm) {
    function optionalNumber(value) {
      if (value === '' || value === null || value === undefined) return null;
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    }

    const menuOrder = optionalNumber(sourceForm.menu_order);

    return {
      ...sourceForm,
      id: String(sourceForm.id || '').trim().toUpperCase(),
      name: String(sourceForm.name || '').trim(),
      brand: String(sourceForm.brand || '').trim(),
      category: String(sourceForm.category || '').trim(),
      description: String(sourceForm.description || '').trim(),
      notes: String(sourceForm.notes || '').trim(),
      thc: String(sourceForm.thc || '').trim(),
      cbd: String(sourceForm.cbd || '').trim(),
      quality_level: optionalNumber(sourceForm.quality_level),
      price_unit: optionalNumber(sourceForm.price_unit),
      price_1g: optionalNumber(sourceForm.price_1g),
      price_3g: optionalNumber(sourceForm.price_3g),
      price_5g: optionalNumber(sourceForm.price_5g),
      price_10g: optionalNumber(sourceForm.price_10g),
      price_20g: optionalNumber(sourceForm.price_20g),
      price_50g: optionalNumber(sourceForm.price_50g),
      price_100g: optionalNumber(sourceForm.price_100g),
      price_promo: String(sourceForm.price_promo || '').trim(),
      menu_order:
        menuOrder === null ? 0 : Math.max(0, Math.trunc(menuOrder)),
      active: sourceForm.active === true,
      featured: sourceForm.featured === true,
    };
  }

  async function createProduct(productData) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(result.error || 'Errore durante la creazione del prodotto');
    }

    return result.product;
  }

  async function updateProduct(productId, updates) {
    const response = await fetch(
      `/api/products/${encodeURIComponent(productId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(
        result.error || 'Errore durante il salvataggio dei file del prodotto'
      );
    }

    return result.product;
  }

  async function uploadFile(file, folder) {
    if (!file) return null;
    if (!hasSupabaseConfig || !supabase) {
      throw new Error('Configurazione Supabase mancante');
    }

    const authorizationResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder,
      }),
    });

    const authorizationResult = await readJsonResponse(authorizationResponse);

    if (!authorizationResponse.ok) {
      throw new Error(
        authorizationResult.error ||
          'Errore durante la preparazione del caricamento'
      );
    }

    const { path, token } = authorizationResult;

    if (!path || !token) {
      throw new Error('Autorizzazione upload non valida');
    }

    const { error: uploadError } = await supabase.storage
      .from('product-media')
      .uploadToSignedUrl(path, token, file, {
        contentType: file.type || undefined,
        cacheControl: '3600',
      });

    if (uploadError) throw uploadError;
    return path;
  }

  async function save(event) {
    event.preventDefault();

    const productData = prepareProductData(form);

    if (!productData.id) {
      alert('Inserisci il codice prodotto.');
      return;
    }

    if (!productData.name) {
      alert('Inserisci il nome prodotto.');
      return;
    }

    try {
      setSaving(true);

      const createdProduct = await createProduct(productData);
      const mediaUpdates = {};

      if (imageFile) {
        setUploadingImage(true);
        mediaUpdates.image_path = await uploadFile(imageFile, 'images');
        mediaUpdates.image_url = '';
      }

      if (videoFile) {
        setUploadingVideo(true);
        mediaUpdates.video_path = await uploadFile(videoFile, 'videos');
        mediaUpdates.video_url = '';
      }

      if (mediaUpdates.image_path || mediaUpdates.video_path) {
        await updateProduct(createdProduct.id, {
          ...createdProduct,
          ...mediaUpdates,
        });
      }

      alert('Prodotto creato correttamente.');

      router.push(
        `/admin/products/${encodeURIComponent(createdProduct.id)}/edit`
      );
      router.refresh();
    } catch (error) {
      console.error('Errore creazione prodotto:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Errore durante la creazione del prodotto'
      );
    } finally {
      setSaving(false);
      setUploadingImage(false);
      setUploadingVideo(false);
    }
  }

  const operationInProgress = saving || uploadingImage || uploadingVideo;

  return (
    <>
      <Header title="Nuovo prodotto" />

      <main className="mx-auto max-w-4xl px-5 pb-28 pt-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-sm font-bold text-gray-500 transition hover:text-green-600"
          >
            ← Torna alla Dashboard
          </button>
        </div>

        <form onSubmit={save} className="space-y-5">
          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h1 className="text-3xl font-black text-gray-900">
              Nuovo prodotto
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Inserisci tutte le informazioni del prodotto.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 uppercase outline-none focus:border-green-500"
                placeholder="Codice prodotto"
                value={form.id}
                onChange={(event) =>
                  updateField('id', event.target.value.toUpperCase())
                }
                required
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Nome prodotto"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Brand"
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
              />

              <select
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                value={form.category}
                onChange={(event) => updateField('category', event.target.value)}
              >
                {categories
                  .filter((category) => category.active !== false)
                  .map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.title}
                    </option>
                  ))}
              </select>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">Media</h2>
            <p className="mt-1 text-sm text-gray-500">
              I file verranno caricati dopo la creazione del prodotto.
            </p>

            <label className="mt-5 block text-sm font-bold text-gray-700">
              Immagine prodotto
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={operationInProgress}
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) =>
                setImageFile(event.target.files?.[0] || null)
              }
            />
            {imageFile ? (
              <p className="mt-2 text-sm font-bold text-green-700">
                ✓ {imageFile.name}
              </p>
            ) : null}

            <label className="mt-6 block text-sm font-bold text-gray-700">
              Video breve
            </label>
            <input
              type="file"
              accept="video/*"
              disabled={operationInProgress}
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) =>
                setVideoFile(event.target.files?.[0] || null)
              }
            />
            {videoFile ? (
              <p className="mt-2 text-sm font-bold text-green-700">
                ✓ {videoFile.name}
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">Dettagli</h2>

            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700">
                Descrizione
              </label>
              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Descrizione del prodotto"
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
              />
            </div>

            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700">
                Informazioni aggiuntive
              </label>
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder={`Esempio:\n\nDisponibile fino a esaurimento.\nEdizione limitata.\nSolo su prenotazione.`}
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="THC"
                value={form.thc}
                onChange={(event) => updateField('thc', event.target.value)}
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="CBD"
                value={form.cbd}
                onChange={(event) => updateField('cbd', event.target.value)}
              />
            </div>
          </section>

          <ProductPrices form={form} updateField={updateField} />

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Stato prodotto
            </h2>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">Prodotto attivo</span>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField('active', event.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">In evidenza</span>
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField('featured', event.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={operationInProgress}
            className="sticky bottom-4 z-10 w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
          >
            {saving
              ? uploadingImage
                ? 'Caricamento immagine...'
                : uploadingVideo
                  ? 'Caricamento video...'
                  : 'Creazione prodotto...'
              : 'Crea prodotto'}
          </button>
        </form>
      </main>
    </>
  );
}