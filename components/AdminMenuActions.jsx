'use client';

import { useEffect, useState } from 'react';

export default function AdminMenuActions() {
  const [settings, setSettings] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/settings?t=${Date.now()}`,
        {
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Errore caricamento impostazioni'
        );
      }

      setSettings(result.settings);
    } catch (error) {
      console.error(
        'Errore caricamento impostazioni menu:',
        error
      );

      setMessage(
        '❌ Impossibile caricare le impostazioni del menu.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function changeMode(mode) {
    if (
      mode !== 'manual' &&
      mode !== 'automatic'
    ) {
      return;
    }

    /*
     * Non permettiamo di attivare Manuale
     * se non è ancora stato caricato un PDF.
     */
    if (
      mode === 'manual' &&
      !settings?.menu_pdf_path
    ) {
      setMessage(
        '⚠️ Carica prima un PDF manuale.'
      );
      return;
    }

    try {
      setChangingMode(true);
      setMessage('');

      const response = await fetch(
        '/api/settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            menu_pdf_mode: mode,

            /*
             * Manteniamo i valori correnti delle
             * altre impostazioni per non alterarli.
             */
            catalog_name:
              settings.catalog_name ?? '',
            catalog_url:
              settings.catalog_url ?? '',
            welcome_message:
              settings.welcome_message ?? '',

            telegram_enabled:
              settings.telegram_enabled === true,
            telegram_username:
              settings.telegram_username ?? '',
            telegram_phone:
              settings.telegram_phone ?? '',

            signal_enabled:
              settings.signal_enabled === true,
            signal_phone:
              settings.signal_phone ?? '',
            signal_url:
              settings.signal_url ?? '',

            whatsapp_phone:
              settings.whatsapp_phone ?? '',
            contact_email:
              settings.contact_email ?? '',

            popup_enabled:
              settings.popup_enabled === true,
            popup_title:
              settings.popup_title ?? '',
            popup_message:
              settings.popup_message ?? '',
            popup_button_text:
              settings.popup_button_text ??
              'Ho capito',

            logo_url:
              settings.logo_url ?? '',
            primary_color:
              settings.primary_color ?? 'green',
            secondary_color:
              settings.secondary_color ??
              'emerald',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Errore cambio modalità'
        );
      }

      setSettings(result.settings);

      setMessage(
        mode === 'manual'
          ? '✅ Modalità manuale attivata.'
          : '✅ Modalità automatica attivata.'
      );
    } catch (error) {
      console.error(
        'Errore cambio modalità menu:',
        error
      );

      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : 'Errore cambio modalità'
        }`
      );
    } finally {
      setChangingMode(false);
    }
  }

  async function uploadPdf() {
    if (!file) {
      setMessage(
        '⚠️ Seleziona prima un file PDF.'
      );
      return;
    }

    try {
      setUploading(true);
      setMessage('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        '/api/menu-upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Errore caricamento PDF'
        );
      }

      setSettings((current) => ({
        ...current,
        ...result.settings,
      }));

      setFile(null);

      /*
       * Reset del campo file.
       */
      const input =
        document.getElementById(
          'weedlivero-menu-pdf'
        );

      if (input) {
        input.value = '';
      }

      setMessage(
        '✅ Nuovo menu PDF pubblicato. Modalità manuale attiva.'
      );
    } catch (error) {
      console.error(
        'Errore upload PDF:',
        error
      );

      setMessage(
        `❌ ${
          error instanceof Error
            ? error.message
            : 'Errore caricamento PDF'
        }`
      );
    } finally {
      setUploading(false);
    }
  }

  function downloadMenu() {
    window.location.href =
      `/api/menu?t=${Date.now()}`;
  }

  async function copyMenuLink() {
    const menuUrl =
      `${window.location.origin}/menu`;

    try {
      await navigator.clipboard.writeText(
        menuUrl
      );

      setMessage(
        '✅ Link del menu copiato.'
      );
    } catch {
      alert(
        `Copia questo link: ${menuUrl}`
      );
    }
  }

  async function shareMenu() {
    const menuUrl =
      `${window.location.origin}/menu`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Menu Weedlivero',
          text:
            'Consulta e scarica il menu Weedlivero.',
          url: menuUrl,
        });

        return;
      }

      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(
          menuUrl
        )}&text=${encodeURIComponent(
          'Consulta il menu Weedlivero'
        )}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (error) {
      console.error(
        'Errore condivisione menu:',
        error
      );
    }
  }

  if (loading) {
    return (
      <section className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-md">
        <p className="font-bold text-gray-500">
          Caricamento gestione menu...
        </p>
      </section>
    );
  }

  const manualMode =
    settings?.menu_pdf_mode === 'manual';

  return (
    <section className="mt-8 rounded-3xl border border-emerald-100 bg-white p-6 shadow-md">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
          Menu utenti
        </p>

        <h2 className="mt-1 text-2xl font-black text-gray-900">
          Gestione Menu PDF
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Scegli se utilizzare un PDF caricato
          manualmente oppure il generatore
          automatico Weedlivero.
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-black text-gray-900">
          Modalità menu
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={
              changingMode || manualMode
            }
            onClick={() =>
              changeMode('manual')
            }
            className={`rounded-2xl border-2 px-5 py-4 font-black transition ${
              manualMode
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-gray-200 bg-white text-gray-700'
            } disabled:cursor-default`}
          >
            📤 Manuale
            {manualMode ? ' ✓' : ''}
          </button>

          <button
            type="button"
            disabled={
              changingMode || !manualMode
            }
            onClick={() =>
              changeMode('automatic')
            }
            className={`rounded-2xl border-2 px-5 py-4 font-black transition ${
              !manualMode
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-gray-200 bg-white text-gray-700'
            } disabled:cursor-default`}
          >
            ⚙️ Automatico
            {!manualMode ? ' ✓' : ''}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-black text-gray-900">
          PDF manuale
        </p>

        {settings?.menu_pdf_path ? (
          <div className="mt-3 rounded-xl bg-white p-4">
            <p className="text-xs font-bold uppercase text-gray-400">
              PDF attualmente caricato
            </p>

            <p className="mt-1 break-all font-bold text-gray-800">
              📄{' '}
              {settings.menu_pdf_name ||
                'menu-weedlivero.pdf'}
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
            Nessun PDF manuale caricato.
          </div>
        )}

        <label
          htmlFor="weedlivero-menu-pdf"
          className="mt-5 block text-sm font-bold text-gray-700"
        >
          Seleziona nuovo PDF
        </label>

        <input
          id="weedlivero-menu-pdf"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) =>
            setFile(
              event.target.files?.[0] ||
                null
            )
          }
          className="mt-2 block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm"
        />

        {file ? (
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Selezionato: {file.name}
          </p>
        ) : null}

        <button
          type="button"
          disabled={uploading || !file}
          onClick={uploadPdf}
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-4 font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading
            ? '⏳ Caricamento...'
            : '📤 Pubblica questo PDF'}
        </button>

        <p className="mt-3 text-xs leading-5 text-gray-400">
          Formato PDF · massimo 20 MB. Un
          nuovo caricamento sostituisce il menu
          manuale precedente.
        </p>
      </div>

      {message ? (
        <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-center text-sm font-bold text-gray-700">
          {message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={downloadMenu}
          className="rounded-2xl bg-gray-900 px-5 py-4 font-black text-white transition active:scale-[0.98]"
        >
          📄 Scarica menu attuale
        </button>

        <a
          href="/menu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center font-black text-emerald-700 transition active:scale-[0.98]"
        >
          👁️ Anteprima pagina utenti
        </a>

        <button
          type="button"
          onClick={copyMenuLink}
          className="rounded-2xl border border-gray-200 bg-white px-5 py-4 font-black text-gray-700 transition active:scale-[0.98]"
        >
          🔗 Copia link utenti
        </button>

        <button
          type="button"
          onClick={shareMenu}
          className="rounded-2xl bg-sky-600 px-5 py-4 font-black text-white transition active:scale-[0.98]"
        >
          ✈️ Condividi
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-gray-50 p-4">
        <p className="text-xs font-bold uppercase text-gray-400">
          Modalità attuale
        </p>

        <p className="mt-1 font-black text-gray-800">
          {manualMode
            ? '📤 PDF manuale'
            : '⚙️ Generazione automatica'}
        </p>
      </div>
    </section>
  );
}