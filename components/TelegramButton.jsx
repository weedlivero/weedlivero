'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

function cleanTelegramUsername(username) {
  return String(username || '')
    .trim()
    .replace(/^@+/, '');
}

function cleanPhoneNumber(phone) {
  return String(phone || '')
    .trim()
    .replace(/[^\d+]/g, '');
}

export default function TelegramButton() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`/api/settings?t=${Date.now()}`, {
          cache: 'no-store',
        });

        const result = await response.json();

        if (response.ok) {
          setSettings(result.settings || {});
        }
      } catch (error) {
        console.error('Errore caricamento contatti:', error);
      }
    }

    loadSettings();
  }, []);

  if (!settings) {
    return null;
  }

  const telegramUsername = cleanTelegramUsername(
    settings.telegram_username
  );

  const signalPhone = cleanPhoneNumber(
    settings.signal_phone
  );

  const telegramAvailable =
    settings.telegram_enabled === true &&
    telegramUsername.length > 0;

  const signalUrl = settings.signal_url?.trim()
    ? settings.signal_url.trim()
    : signalPhone
      ? `https://signal.me/#p/${encodeURIComponent(signalPhone)}`
      : '';

  const signalAvailable =
    settings.signal_enabled === true &&
    signalUrl.length > 0;

  if (!telegramAvailable && !signalAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[calc(100vw-2.5rem)] max-w-xs rounded-3xl border border-gray-100 bg-white p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-black text-gray-900">
                💬 Contattaci
              </p>

              <p className="mt-2 text-sm leading-5 text-gray-500">
                Il nostro staff è disponibile per informazioni sui
                prodotti e assistenza.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition active:scale-95"
              aria-label="Chiudi contatti"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {telegramAvailable ? (
              <a
                href={`https://t.me/${encodeURIComponent(
                  telegramUsername
                )}`}
                onClick={() => setOpen(false)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 p-4 font-black text-white transition active:scale-[0.98]"
              >
                <Send size={19} />
                Contattaci su Telegram
              </a>
            ) : null}

            {signalAvailable ? (
              <a
                href={signalUrl}
                onClick={() => setOpen(false)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 font-black text-white transition active:scale-[0.98]"
              >
                <MessageCircle size={19} />
                Contattaci su Signal
              </a>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-4 font-black text-white shadow-2xl transition active:scale-[0.98]"
          aria-expanded={open}
          aria-label="Apri contatti"
        >
          <MessageCircle size={20} />
          Contattaci
        </button>
      )}
    </div>
  );
}