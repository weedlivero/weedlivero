'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function TelegramRegistrationWidget({ onVerified, onError }) {
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const timerRef = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function beginVerification() {
    const telegramWindow = window.open('about:blank', '_blank');
    setLoading(true);
    setStatus('');
    onError('');

    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const response = await fetch('/api/customer/telegram/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok || !result.requestCode || !result.browserSecret) {
        if (telegramWindow) telegramWindow.close();
        throw new Error(result.error || 'Impossibile avviare Telegram.');
      }

      if (!activeRef.current) return;

      setVerification(result);
      setStatus('Apri Telegram e premi Avvia nel bot.');

      if (telegramWindow) telegramWindow.location.replace(result.botUrl);

      let checking = false;

      timerRef.current = setInterval(async () => {
        if (checking || !activeRef.current) return;
        checking = true;

        try {
          if (Date.now() >= new Date(result.expiresAt).getTime()) {
            clearInterval(timerRef.current);
            setVerification(null);
            setStatus('');
            onError('Verifica scaduta. Riprova.');
            return;
          }

          const checkResponse = await fetch('/api/customer/telegram/bot/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestCode: result.requestCode,
              browserSecret: result.browserSecret,
            }),
            cache: 'no-store',
          });

          const check = await checkResponse.json();

          if (!checkResponse.ok) {
            if (checkResponse.status === 429) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              setVerification(null);
              setStatus('');
              onError('Limite temporaneo raggiunto. Riprova tra qualche minuto.');
            }
            return;
          }

          if (check.status === 'expired') {
            clearInterval(timerRef.current);
            setVerification(null);
            onError('Verifica scaduta. Riprova.');
            return;
          }

          if (check.status !== 'verified') return;

          clearInterval(timerRef.current);
          setStatus('Verifica completata. Preparazione registrazione...');

          const completeResponse = await fetch('/api/customer/telegram/bot/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestCode: result.requestCode,
              browserSecret: result.browserSecret,
            }),
            cache: 'no-store',
          });

          const completed = await completeResponse.json();

          if (!completeResponse.ok || !completed.verificationToken) {
            throw new Error(completed.error || 'Verifica non completata.');
          }

          if (!activeRef.current) return;

          setVerification(null);
          setStatus('');
          onVerified(completed);

        } catch (error) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (activeRef.current) {
            setStatus('');
            onError(error.message || 'Errore durante la verifica.');
          }
        } finally {
          checking = false;
        }
      }, 10000);

    } catch (error) {
      if (activeRef.current) {
        onError(error.message || 'Impossibile collegarsi al bot.');
      }
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }

  return (
    <div className="space-y-3 py-2">
      <button
        type="button"
        disabled={loading}
        onClick={beginVerification}
        className="wl-button-primary w-full px-4 py-3 text-sm disabled:opacity-60"
      >
        {loading ? 'Attendi...' : verification ? 'Ricomincia verifica Telegram' : 'Verificati con Telegram'}
      </button>
      {verification ? (
        <a
          href={verification.botUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold text-emerald-700 underline"
        >
          Apri @wliveroverifybot
        </a>
      ) : null}
      {status ? <p role="status" className="text-xs text-gray-600">{status}</p> : null}
    </div>
  );
}

export default function CustomerAccessPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestEnabled, setGuestEnabled] = useState(false);
  const [telegramVerification, setTelegramVerification] = useState(null);

  const handleTelegramVerified = useCallback((result) => {
    setTelegramVerification(result);
    setError('');
    setNotice('Account Telegram verificato. Ora scegli la password.');
  }, []);

  const handleTelegramError = useCallback((message) => {
    setTelegramVerification(null);
    setError(message);
  }, []);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [settingsResponse, sessionResponse] = await Promise.all([
          fetch('/api/public-settings', { cache: 'no-store' }),
          fetch('/api/customer/session', { cache: 'no-store' }),
        ]);
        if (active && settingsResponse.ok) {
          const result = await settingsResponse.json();
          setGuestEnabled(result?.settings?.guest_access_enabled === true);
        }
        if (active && sessionResponse.ok) {
          const session = await sessionResponse.json();
          if (session?.authenticated === true && session?.mustChangePassword !== true) {
            setNotice('Hai giÃƒÆ’Ã‚Â  effettuato lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢accesso. Puoi entrare nel catalogo.');
          }
        }
      } catch {
        // L'ingresso ospite resta nascosto se non ÃƒÆ’Ã‚Â¨ possibile verificare le impostazioni.
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'register' && !telegramVerification?.verificationToken) {
      setError('Devi prima verificare il tuo account Telegram.');
      return;
    }
    if (
      mode === 'register' &&
      (!telegramVerification.expiresAt ||
        Date.now() >= new Date(telegramVerification.expiresAt).getTime())
    ) {
      setTelegramVerification(null);
      setError('La verifica Telegram ÃƒÆ’Ã‚Â¨ scaduta. Effettua una nuova verifica.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === 'login' ? '/api/customer/login' : '/api/customer/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register'
            ? {
                verificationToken: telegramVerification.verificationToken,
                password,
              }
            : { username: username.trim(), password }
        ),
        cache: 'no-store',
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.error || 'Operazione non riuscita.');
        return;
      }
      setPassword('');
      setConfirmPassword('');
      if (mode === 'register') {
        setTelegramVerification(null);
        setNotice(result?.message || 'Registrazione completata. Ora puoi accedere.');
        setMode('login');
      } else {
        router.refresh();
        router.push('/');
      }
    } catch {
      setError('Impossibile collegarsi al server. Riprova piÃƒÆ’Ã‚Â¹ tardi.');
    } finally {
      setBusy(false);
    }
  }

  async function enterAsGuest() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/guest-entry', {
        method: 'POST',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Ingresso visitatore non riuscito');
      window.location.assign('/');
    } catch {
      setError('Impossibile entrare come visitatore. Riprova.');
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-lime-200/35 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-green-200/30 blur-3xl" />
      </div>
      <section className="wl-card relative z-10 w-full max-w-sm rounded-[2rem] p-7 text-center sm:p-8">
        <div className="mx-auto flex min-h-[180px] items-center justify-center">
          <Image src="/logo-weedlivero.png" alt="Weedlivero" width={520} height={520} priority className="h-auto w-full max-w-[280px] drop-shadow-[0_18px_30px_rgba(6,95,70,0.12)]" />
        </div>
        <div className="mx-auto mt-2 h-px w-20 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
        <h1 className="mt-5 text-xl font-black text-gray-900">Accesso Weedlivero</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">Accedi con il tuo account, richiedi la registrazione oppure entra come visitatore.</p>
        <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="ModalitÃƒÆ’Ã‚Â  di accesso">
          <button type="button" onClick={() => { setMode('login'); setTelegramVerification(null); setError(''); setNotice(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'login' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'}`}>Accedi</button>
          <button type="button" onClick={() => { setMode('register'); setTelegramVerification(null); setError(''); setNotice(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'register' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'}`}>Registrati</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'register' ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              {telegramVerification ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-emerald-800">
                    Telegram verificato
                  </p>
                  <label
                    htmlFor="verified-telegram-username"
                    className="block text-left text-sm font-semibold text-gray-700"
                  >
                    Username Telegram
                  </label>
                  <input
                    id="verified-telegram-username"
                    type="text"
                    className="wl-input w-full px-4 py-3"
                    value={`@${telegramVerification.telegramUsername || ''}`}
                    readOnly
                    aria-readonly="true"
                    autoComplete="off"
                  />
                  <p className="text-left text-xs text-emerald-700">
                    Username acquisito automaticamente da Telegram.
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-emerald-700 underline"
                    onClick={() => {
                      setTelegramVerification(null);
                      setNotice('');
                    }}
                  >
                    Verifica un altro account
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-sm font-semibold text-gray-800">
                    Prima verifica il tuo account Telegram
                  </p>
                  <TelegramRegistrationWidget
                    onVerified={handleTelegramVerified}
                    onError={handleTelegramError}
                  />
                </>
              )}
            </div>
          ) : (
            <>
              <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-username">Username</label>
              <input id="customer-username" className="wl-input w-full px-4 py-3" autoComplete="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
            </>
          )}
          <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-password">Password</label>
          <input id="customer-password" type="password" className="wl-input w-full px-4 py-3" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          {mode === 'register' ? (
            <>
              <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-confirm">Conferma password</label>
              <input id="customer-confirm" type="password" className="wl-input w-full px-4 py-3" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ripeti password" />
              <p className="text-left text-xs text-gray-500">Minimo 12 caratteri. La registrazione viene completata dopo la verifica Telegram.</p>
            </>
          ) : null}
          {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
          {notice ? <p role="status" className="text-sm font-semibold text-emerald-700">{notice}</p> : null}
          <button type="submit" disabled={busy || (mode === 'register' && !telegramVerification)} className="wl-button-primary w-full px-5 py-4 text-base disabled:opacity-60">{busy ? 'Attendi...' : mode === 'login' ? 'Accedi' : 'Richiedi registrazione'}</button>
        </form>
        {guestEnabled ? (
          <div className="mt-5 border-t border-emerald-100 pt-5">
            <button type="button" disabled={busy} onClick={enterAsGuest} className="w-full rounded-xl border border-emerald-600 px-4 py-3 text-sm font-bold text-emerald-800 disabled:opacity-60">{busy ? 'Attendi...' : 'Entra come visitatore'}</button>
            <p className="mt-2 text-xs text-gray-500">Puoi consultare il catalogo senza registrarti. I visitatori non possono inviare ordini.</p>
          </div>
        ) : null}
        <p className="mt-5 text-xs font-medium text-gray-400">Accesso riservato</p>
      </section>
    </main>
  );
}
