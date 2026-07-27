'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const defaultSettings = {
  catalog_name: '',
  catalog_url: '',
  welcome_message: '',

  telegram_enabled: true,
  telegram_username: '',
  telegram_phone: '',

  signal_enabled: true,
  signal_phone: '',
  signal_url: '',

  contact_email: '',

  popup_enabled: false,
  popup_title: 'Comunicazione',
  popup_message: '',
  popup_button_text: 'Ho capito',
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPopupPreview, setShowPopupPreview] = useState(false);

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

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

  async function loadSettings() {
    try {
      setLoading(true);

      const response = await fetch(`/api/settings?t=${Date.now()}`, {
        cache: 'no-store',
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Errore caricamento impostazioni'
        );
      }

      setSettings({
        ...defaultSettings,
        ...(result.settings || {}),
        telegram_enabled:
          result.settings?.telegram_enabled === true,
        signal_enabled:
          result.settings?.signal_enabled === true,
        popup_enabled:
          result.settings?.popup_enabled === true,
      });
    } catch (error) {
      console.error('Errore caricamento impostazioni:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore caricamento impostazioni'
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setSaving(true);

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error || 'Errore salvataggio impostazioni'
        );
      }

      setSettings({
        ...defaultSettings,
        ...(result.settings || settings),
      });

      alert('Impostazioni salvate!');
    } catch (error) {
      console.error('Errore salvataggio impostazioni:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Errore salvataggio impostazioni'
      );
    } finally {
      setSaving(false);
    }
  }

  function update(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }

  if (loading) {
    return (
      <AdminLayout title="Impostazioni">
        <div className="rounded-3xl bg-white p-8 shadow">
          Caricamento...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Impostazioni">
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900">
            Impostazioni
          </h1>

          <p className="mt-2 text-gray-500">
            Configurazione generale del catalogo.
          </p>
        </div>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              🌐 Catalogo
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informazioni generali del catalogo.
            </p>
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Nome catalogo
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              value={settings.catalog_name || ''}
              onChange={(event) =>
                update('catalog_name', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              URL catalogo
            </label>

            <input
              type="url"
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="https://weedlivero.shop"
              value={settings.catalog_url || ''}
              onChange={(event) =>
                update('catalog_url', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Messaggio di benvenuto
            </label>

            <textarea
              className="mt-2 min-h-28 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              rows={3}
              value={settings.welcome_message || ''}
              onChange={(event) =>
                update('welcome_message', event.target.value)
              }
            />
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              ✈️ Telegram
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configurazione del contatto Telegram.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="font-bold text-gray-800">
              Telegram attivo
            </span>

            <input
              type="checkbox"
              checked={settings.telegram_enabled === true}
              onChange={(event) =>
                update('telegram_enabled', event.target.checked)
              }
              className="h-5 w-5"
            />
          </label>

          <div>
            <label className="font-bold text-gray-800">
              Username Telegram
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="weedlivero"
              value={settings.telegram_username || ''}
              onChange={(event) =>
                update('telegram_username', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Numero Telegram
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="+39..."
              value={settings.telegram_phone || ''}
              onChange={(event) =>
                update('telegram_phone', event.target.value)
              }
            />
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              🔵 Signal
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Configurazione del contatto Signal.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
            <span className="font-bold text-gray-800">
              Signal attivo
            </span>

            <input
              type="checkbox"
              checked={settings.signal_enabled === true}
              onChange={(event) =>
                update('signal_enabled', event.target.checked)
              }
              className="h-5 w-5"
            />
          </label>

          <div>
            <label className="font-bold text-gray-800">
              Numero Signal
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="+39..."
              value={settings.signal_phone || ''}
              onChange={(event) =>
                update('signal_phone', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Link Signal
            </label>

            <input
              type="url"
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="https://signal.me/..."
              value={settings.signal_url || ''}
              onChange={(event) =>
                update('signal_url', event.target.value)
              }
            />

            <p className="mt-2 text-xs text-gray-400">
              Se compilato, il link Signal avrà priorità sul numero.
            </p>
          </div>
        </section>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              📢 Comunicazione agli utenti
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Mostra un avviso personalizzato dopo l’accesso al
              catalogo.
            </p>
          </div>

          <label className="flex items-center justify-between rounded-2xl bg-amber-50 p-4">
            <div>
              <p className="font-bold text-gray-800">
                Mostra comunicazione
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Il popup comparirà agli utenti dopo l’accesso.
              </p>
            </div>

            <input
              type="checkbox"
              checked={settings.popup_enabled === true}
              onChange={(event) =>
                update('popup_enabled', event.target.checked)
              }
              className="h-5 w-5"
            />
          </label>

          <div>
            <label className="font-bold text-gray-800">
              Titolo comunicazione
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="⚠️ Comunicazione importante"
              value={settings.popup_title || ''}
              onChange={(event) =>
                update('popup_title', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Messaggio
            </label>

            <textarea
              className="mt-2 min-h-40 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="Scrivi qui la comunicazione da mostrare agli utenti..."
              value={settings.popup_message || ''}
              onChange={(event) =>
                update('popup_message', event.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Testo pulsante
            </label>

            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              placeholder="Ho capito"
              value={settings.popup_button_text || ''}
              onChange={(event) =>
                update('popup_button_text', event.target.value)
              }
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPopupPreview(true)}
            className="w-full rounded-2xl bg-gray-900 p-4 font-black text-white transition active:scale-[0.98]"
          >
            👁️ Mostra anteprima
          </button>
        </section>

        <section className="space-y-5 rounded-3xl bg-white p-6 shadow">
          <div>
            <h2 className="text-2xl font-black text-gray-900">
              📧 Contatti
            </h2>
          </div>

          <div>
            <label className="font-bold text-gray-800">
              Email
            </label>

            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-gray-200 p-4 outline-none focus:border-green-500"
              value={settings.contact_email || ''}
              onChange={(event) =>
                update('contact_email', event.target.value)
              }
            />
          </div>
        </section>

        <button
          type="button"
          onClick={saveSettings}
          disabled={saving}
          className="sticky bottom-4 z-10 w-full rounded-2xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:shadow-none"
        >
          {saving ? 'Salvataggio...' : 'Salva impostazioni'}
        </button>
      </div>

      {showPopupPreview ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
              📢
            </div>

            <h2 className="mt-5 text-2xl font-black text-gray-900">
              {settings.popup_title || 'Comunicazione'}
            </h2>

            <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-600">
              {settings.popup_message ||
                'Inserisci un messaggio da mostrare agli utenti.'}
            </p>

            <button
              type="button"
              onClick={() => setShowPopupPreview(false)}
              className="mt-6 w-full rounded-2xl bg-green-600 p-4 font-black text-white"
            >
              {settings.popup_button_text || 'Ho capito'}
            </button>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}