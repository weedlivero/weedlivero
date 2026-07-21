'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { categories } from '@/data/categories';
import Header from '@/components/Header';

export default function NewProductPage() {
  const router = useRouter();

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function uploadFile(file, folder) {
    if (!file) return;

    const isVideo = folder === 'videos';

    if (!hasSupabaseConfig || !supabase) {
      alert('Configurazione Supabase mancante');
      return;
    }

    if (isVideo) {
      setUploadingVideo(true);
    } else {
      setUploadingImage(true);
    }

    try {
      /*
       * Chiediamo al server un token temporaneo.
       * Il file non passa attraverso Vercel.
       */
      const authorizationResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder,
        }),
      });

      const authorizationResult = await authorizationResponse.json();

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

      /*
       * Caricamento diretto dal browser a Supabase Storage.
       */
      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .uploadToSignedUrl(path, token, file, {
          contentType: file.type || undefined,
          cacheControl: '3600',
        });

      if (uploadError) {
        throw uploadError;
      }

      if (isVideo) {
        setForm((current) => ({
          ...current,
          video_path: path,
          video_url: '',
        }));
      } else {
        setForm((current) => ({
          ...current,
          image_path: path,
          image_url: '',
        }));
      }
    } catch (error) {
      console.error('Errore upload:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore durante il caricamento del file'
      );
    } finally {
      if (isVideo) {
        setUploadingVideo(false);
      } else {
        setUploadingImage(false);
      }
    }
  }

  async function save(event) {
    event.preventDefault();

    if (uploadingImage || uploadingVideo) {
      alert('Attendi la fine del caricamento dei file');
      return;
    }

    setSaving(true);

    try {
      const productData = {
        ...form,
        id: form.id.trim() || `${form.category}-${Date.now()}`,
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        thc: form.thc.trim(),
        cbd: form.cbd.trim(),
      };

      if (hasSupabaseConfig && supabase) {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) {
          if (
            error.code === '23505' ||
            error.message?.toLowerCase().includes('duplicate key')
          ) {
            throw new Error(
              'Esiste già un prodotto con questo codice. Aprilo dall’elenco e modificalo.'
            );
          }

          throw error;
        }
      }

      window.location.href = '/admin/products';
    } catch (error) {
      console.error('Errore salvataggio prodotto:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore durante il salvataggio del prodotto'
      );
    } finally {
      setSaving(false);
    }
  }

  const uploadInProgress = uploadingImage || uploadingVideo;

  return (
    <>
      <Header title="Nuovo prodotto" />

      <main className="mx-auto max-w-4xl px-5 pb-28 pt-8">
        <form onSubmit={save} className="space-y-5">
          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h1 className="text-3xl font-black text-gray-900">
              Nuovo prodotto
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Inserisci le informazioni principali.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Codice prodotto"
                value={form.id}
                onChange={(event) =>
                  updateField('id', event.target.value)
                }
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Nome prodotto"
                value={form.name}
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
                required
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Brand"
                value={form.brand}
                onChange={(event) =>
                  updateField('brand', event.target.value)
                }
              />

              <select
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                value={form.category}
                onChange={(event) =>
                  updateField('category', event.target.value)
                }
              >
                {categories
                  .filter((category) => category.active !== false)
                  .map((category) => (
                    <option
                      key={category.slug}
                      value={category.slug}
                    >
                      {category.title}
                    </option>
                  ))}
              </select>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Media
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Immagini e video vengono caricati direttamente nello
              Storage privato.
            </p>

            <label className="mt-5 block text-sm font-bold text-gray-700">
              Immagine prodotto
            </label>

            <input
              type="file"
              accept="image/*"
              disabled={uploadingImage}
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) =>
                uploadFile(event.target.files?.[0], 'images')
              }
            />

            {uploadingImage ? (
              <p className="mt-3 text-sm font-bold text-gray-500">
                Caricamento immagine...
              </p>
            ) : null}

            {form.image_path ? (
              <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">
                ✓ Immagine caricata
              </p>
            ) : null}

            <label className="mt-6 block text-sm font-bold text-gray-700">
              Video breve
            </label>

            <input
              type="file"
              accept="video/*"
              disabled={uploadingVideo}
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) =>
                uploadFile(event.target.files?.[0], 'videos')
              }
            />

            {uploadingVideo ? (
              <p className="mt-3 text-sm font-bold text-gray-500">
                Caricamento video...
              </p>
            ) : null}

            {form.video_path ? (
              <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">
                ✓ Video caricato
              </p>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Dettagli
            </h2>

            <textarea
              className="mt-5 min-h-32 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="Descrizione prodotto"
              value={form.description}
              onChange={(event) =>
                updateField('description', event.target.value)
              }
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="THC"
                value={form.thc}
                onChange={(event) =>
                  updateField('thc', event.target.value)
                }
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="CBD"
                value={form.cbd}
                onChange={(event) =>
                  updateField('cbd', event.target.value)
                }
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Stato prodotto
            </h2>

            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <span className="font-bold text-gray-800">
                  Prodotto attivo
                </span>

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
                <span className="font-bold text-gray-800">
                  In evidenza
                </span>

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

          <div className="sticky bottom-4 z-10">
            <button
              type="submit"
              disabled={saving || uploadInProgress}
              className="w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
            >
              {saving
                ? 'Salvataggio...'
                : uploadInProgress
                  ? 'Attendi il caricamento...'
                  : 'Salva prodotto'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}