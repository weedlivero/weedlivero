'use client';

import { useEffect, useState } from 'react';

export default function RequestContactButtons({ products }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch('/api/settings', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (response.ok) {
        setSettings(result.settings);
      }
    }

    loadSettings();
  }, []);

  if (!settings) {
    return null;
  }

  return (
    <div className="mt-8 space-y-3">

      {settings.telegram_enabled && (
        <button
          type="button"
          className="w-full rounded-2xl bg-sky-500 p-4 font-black text-white"
        >
          ✈️ Invia con Telegram
        </button>
      )}

      {settings.signal_enabled && (
        <button
          type="button"
          className="w-full rounded-2xl bg-blue-600 p-4 font-black text-white"
        >
          🔵 Invia con Signal
        </button>
      )}

    </div>
  );
}