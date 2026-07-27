'use client';

import { useEffect, useState } from 'react';

const SESSION_KEY = 'weedlivero_popup_seen';

export default function UserPopup() {
  const [settings, setSettings] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function loadPopupSettings() {
      try {
        let alreadySeen = false;

        try {
          alreadySeen =
            window.sessionStorage.getItem(SESSION_KEY) === 'yes';
        } catch (storageError) {
          console.warn(
            'SessionStorage non disponibile:',
            storageError
          );
        }

        if (alreadySeen) {
          return;
        }

        const response = await fetch(`/api/settings?t=${Date.now()}`, {
          cache: 'no-store',
        });

        const responseText = await response.text();

        let result = {};

        if (responseText) {
          try {
            result = JSON.parse(responseText);
          } catch {
            throw new Error(
              `Risposta non valida dal server (${response.status})`
            );
          }
        }

        if (!response.ok) {
          throw new Error(
            result.error || 'Errore caricamento comunicazione'
          );
        }

        const loadedSettings = result.settings || {};

        const popupEnabled =
          loadedSettings.popup_enabled === true;

        const popupMessage = String(
          loadedSettings.popup_message || ''
        ).trim();

        if (!popupEnabled || !popupMessage) {
          return;
        }

        setSettings(loadedSettings);
        setVisible(true);
      } catch (error) {
        console.error(
          'Errore caricamento popup utente:',
          error
        );
      }
    }

    loadPopupSettings();
  }, []);

  function closePopup() {
    try {
      window.sessionStorage.setItem(SESSION_KEY, 'yes');
    } catch (storageError) {
      console.warn(
        'Impossibile salvare la chiusura del popup:',
        storageError
      );
    }

    setVisible(false);
  }

  if (!visible || !settings) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-popup-title"
    >
      <div className="w-full max-w-md rounded-[2rem] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-3xl">
          📢
        </div>

        <h2
          id="user-popup-title"
          className="mt-5 text-2xl font-black text-gray-900"
        >
          {settings.popup_title || 'Comunicazione'}
        </h2>

        <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-600">
          {settings.popup_message}
        </p>

        <button
          type="button"
          onClick={closePopup}
          className="mt-6 w-full rounded-2xl bg-green-600 p-4 font-black text-white transition active:scale-[0.98]"
        >
          {settings.popup_button_text || 'Ho capito'}
        </button>
      </div>
    </div>
  );
}