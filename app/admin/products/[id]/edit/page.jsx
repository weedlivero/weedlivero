'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, hasSupabaseConfig } from '@/lib/supabase';
import { demoProducts } from '@/data/demoProducts';
import { categories } from '@/data/categories';
import Header from '@/components/Header';
import ProductPrices from '@/components/admin/ProductPrices';


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [form, setForm] = useState({
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
});

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function readJsonResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(
        `Risposta non valida dal server (${response.status})`
      );
    }
  }

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);

        if (!hasSupabaseConfig || !supabase) {
          const product = demoProducts.find(
            (item) => item.id === params.id
          );

          if (product) {
            setForm((current) => ({
              ...current,
              ...product,
            }));
          }

          return;
        }

        const response = await fetch(
          `/api/products/${encodeURIComponent(params.id)}`,
          {
            cache: 'no-store',
          }
        );

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Errore durante il caricamento del prodotto'
          );
        }

        if (result.product) {
          setForm((current) => ({
            ...current,
            ...result.product,
          }));
        }
      } catch (error) {
        console.error('Errore caricamento prodotto:', error);

        alert(
          error instanceof Error
            ? error.message
            : 'Errore durante il caricamento del prodotto'
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadProduct();
    }
  }, [params.id]);

  function prepareProductData(sourceForm) {
    return {
      ...sourceForm,
      name: String(sourceForm.name || '').trim(),
      brand: String(sourceForm.brand || '').trim(),
      category: String(sourceForm.category || '').trim(),
      description: String(sourceForm.description || '').trim(),
      notes: String(sourceForm.notes || '').trim(),
      thc: String(sourceForm.thc || '').trim(),
      cbd: String(sourceForm.cbd || '').trim(),
      active: sourceForm.active === true,
      featured: sourceForm.featured === true,
    };
  }

  async function updateProduct(productData) {
    const response = await fetch(
      `/api/products/${encodeURIComponent(params.id)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      }
    );

    const result = await readJsonResponse(response);

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Errore durante l’aggiornamento del prodotto'
      );
    }

    return result.product;
  }

  async function uploadFile(file, folder) {
    if (!file) {
      return;
    }

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

      const authorizationResult =
        await readJsonResponse(authorizationResponse);

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

      if (uploadError) {
        throw uploadError;
      }

      const mediaUpdate = isVideo
        ? {
            video_path: path,
            video_url: '',
          }
        : {
            image_path: path,
            image_url: '',
          };

      const updatedForm = {
        ...form,
        ...mediaUpdate,
      };

      const updatedProduct = await updateProduct(
        prepareProductData(updatedForm)
      );

      setForm((current) => ({
        ...current,
        ...updatedProduct,
      }));

      alert(
        isVideo
          ? 'Video aggiornato correttamente'
          : 'Immagine aggiornata correttamente'
      );
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

    try {
      setSaving(true);

      const productData = prepareProductData(form);
      const updatedProduct = await updateProduct(productData);

      setForm((current) => ({
        ...current,
        ...updatedProduct,
      }));

      alert('Prodotto aggiornato correttamente.');

      window.location.href = '/admin';
    } catch (error) {
      console.error('Errore aggiornamento prodotto:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore durante l’aggiornamento del prodotto'
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const confirmDelete = window.confirm(
      'Vuoi eliminare questo prodotto?'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeleting(true);

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

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Errore eliminazione prodotto'
        );
      }

      window.location.href = '/admin';
    } catch (error) {
      console.error('Errore eliminazione prodotto:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore durante l’eliminazione del prodotto'
      );
    } finally {
      setDeleting(false);
    }
  }

  const operationInProgress =
    saving ||
    deleting ||
    uploadingImage ||
    uploadingVideo;

  if (loading) {
    return (
      <>
        <Header title="Modifica prodotto" />

        <main className="mx-auto max-w-4xl px-5 pb-28 pt-8">
          <div className="rounded-3xl bg-white p-8 text-center shadow-md">
            Caricamento prodotto...
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header title="Modifica prodotto" />

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
              Modifica prodotto
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Aggiorna le informazioni del prodotto.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none"
                placeholder="Codice prodotto"
                value={form.id || ''}
                disabled
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Nome prodotto"
                value={form.name || ''}
                onChange={(event) =>
                  updateField('name', event.target.value)
                }
                required
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Brand"
                value={form.brand || ''}
                onChange={(event) =>
                  updateField('brand', event.target.value)
                }
              />

              <select
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                value={form.category || 'weed'}
                onChange={(event) =>
                  updateField('category', event.target.value)
                }
              >
                {categories
                  .filter(
                    (category) =>
                      category.active !== false ||
                      category.slug === form.category
                  )
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

          <ProductPrices
            form={form}
            updateField={updateField}
          />

          <section className="rounded-3xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-black text-gray-900">
              Stato prodotto
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

            <div className="mt-5">
              <label className="block text-sm font-bold text-gray-700">
                Descrizione
              </label>

              <textarea
                className="mt-2 min-h-32 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="Descrizione del prodotto"
                value={form.description || ''}
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
                className="mt-2 min-h-40 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder={`Esempio:

1 g — €10
3 g — €25
5 g — €40

Disponibile fino a esaurimento.`}
                value={form.notes || ''}
                onChange={(event) =>
                  updateField('notes', event.target.value)
                }
              />

              <p className="mt-2 text-xs text-gray-400">
                Questo testo apparirà solo nella scheda completa del
                prodotto.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="THC"
                value={form.thc || ''}
                onChange={(event) =>
                  updateField('thc', event.target.value)
                }
              />

              <input
                className="rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
                placeholder="CBD"
                value={form.cbd || ''}
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
                  checked={Boolean(form.active)}
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
                  checked={Boolean(form.featured)}
                  onChange={(event) =>
                    updateField('featured', event.target.checked)
                  }
                  className="h-5 w-5"
                />
              </label>
            </div>
          </section>

          <div className="sticky bottom-4 z-10 space-y-3">
            <button
              type="submit"
              disabled={operationInProgress}
              className="w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
            >
              {saving
                ? 'Aggiornamento...'
                : uploadingImage || uploadingVideo
                  ? 'Attendi il caricamento...'
                  : 'Aggiorna prodotto'}
            </button>

            <button
              type="button"
              onClick={remove}
              disabled={operationInProgress}
              className="w-full rounded-2xl bg-red-500 p-4 text-lg font-black text-white shadow-lg shadow-red-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
            >
              {deleting
                ? 'Eliminazione...'
                : 'Elimina prodotto'}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}