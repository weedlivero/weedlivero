'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
  catalog_name: '',
  catalog_url: '',
  welcome_message: '',
  telegram_enabled: true,
  telegram_username: '',
  telegram_phone: '',
  signal_enabled: true,
  signal_phone: '',
  contact_email: '',
});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);

      const response = await fetch('/api/settings', {
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error);
        return;
      }

      setSettings(result.settings);
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

      const result = await response.json();

      if (!response.ok) {
        alert(result.error);
        return;
      }

      alert('Impostazioni salvate!');
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
          <h1 className="text-4xl font-black">
            Impostazioni
          </h1>

          <p className="mt-2 text-gray-500">
            Configurazione generale del catalogo.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow space-y-5">

          <div>
            <label className="font-bold">
              Nome catalogo
            </label>

            <input
              className="mt-2 w-full rounded-2xl border p-4"
              value={settings.catalog_name}
              onChange={(e) =>
                update('catalog_name', e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold">
              Messaggio di benvenuto
            </label>
            <div>
  <label className="font-bold">
    URL catalogo
  </label>

  <input
    className="mt-2 w-full rounded-2xl border p-4"
    value={settings.catalog_url}
    onChange={(e) =>
      update('catalog_url', e.target.value)
    }
  />
</div>

            <textarea
              className="mt-2 w-full rounded-2xl border p-4"
              rows={3}
              value={settings.welcome_message}
              onChange={(e) =>
                update('welcome_message', e.target.value)
              }
            />
          </div>

          <div>
            <label className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
  <span className="font-bold">
    Telegram attivo
  </span>

  <input
    type="checkbox"
    checked={settings.telegram_enabled}
    onChange={(e) =>
      update('telegram_enabled', e.target.checked)
    }
    className="h-5 w-5"
  />
</label>
            <label className="font-bold">
              Username Telegram
            </label>

            <input
              className="mt-2 w-full rounded-2xl border p-4"
              value={settings.telegram_username}
              onChange={(e) =>
                update('telegram_username', e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold">
              Numero Telegram
            </label>

            <input
              className="mt-2 w-full rounded-2xl border p-4"
              value={settings.telegram_phone}
              onChange={(e) =>
                update('telegram_phone', e.target.value)
              }
            />
          </div>

          <div>
            <label className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 p-4">
  <span className="font-bold">
    Signal attivo
  </span>

  <input
    type="checkbox"
    checked={settings.signal_enabled}
    onChange={(e) =>
      update('signal_enabled', e.target.checked)
    }
    className="h-5 w-5"
  />
</label>
            <label className="font-bold">
              Numero Signal
            </label>

            <input
              className="mt-2 w-full rounded-2xl border p-4"
              value={settings.signal_phone}
              onChange={(e) =>
                update('signal_phone', e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-bold">
              Email
            </label>

            <input
              className="mt-2 w-full rounded-2xl border p-4"
              value={settings.contact_email}
              onChange={(e) =>
                update('contact_email', e.target.value)
              }
            />
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full rounded-2xl bg-green-600 p-4 font-black text-white"
          >
            {saving ? 'Salvataggio...' : 'Salva impostazioni'}
          </button>

        </div>

      </div>
    </AdminLayout>
  );
}