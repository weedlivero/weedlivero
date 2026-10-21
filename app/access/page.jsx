'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerAccessPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestEnabled, setGuestEnabled] = useState(false);
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
            setNotice('Sessione cliente attiva. Il catalogo sarÃ  accessibile quando verrÃ  abilitato il nuovo sistema.');
          }
        }
      } catch {
        // Fail closed: guest entry remains hidden if settings cannot be checked.
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
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
        body: JSON.stringify({ username: username.trim(), password }),
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
        setNotice(result?.message || 'Registrazione ricevuta. Attendi lâ€™approvazione.');
        setMode('login');
      } else {
        router.refresh();
        router.push('/');
      }
    } catch {
      setError('Impossibile collegarsi al server. Riprova piÃ¹ tardi.');
    } finally {
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
        <p className="mt-2 text-sm leading-relaxed text-gray-600">Accedi con il tuo account oppure richiedi la registrazione.</p>
        <div className="mt-6 grid grid-cols-2 gap-2" role="group" aria-label="ModalitÃ  di accesso">
          <button type="button" onClick={() => { setMode('login'); setError(''); setNotice(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'login' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'}`}>Accedi</button>
          <button type="button" onClick={() => { setMode('register'); setError(''); setNotice(''); }} className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'register' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'}`}>Registrati</button>
        </div>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-username">Username</label>
          <input id="customer-username" className="wl-input w-full px-4 py-3" autoComplete="username" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" />
          <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-password">Password</label>
          <input id="customer-password" type="password" className="wl-input w-full px-4 py-3" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          {mode === 'register' ? (
            <>
              <label className="block text-left text-sm font-semibold text-gray-700" htmlFor="customer-confirm">Conferma password</label>
              <input id="customer-confirm" type="password" className="wl-input w-full px-4 py-3" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Ripeti password" />
              <p className="text-left text-xs text-gray-500">Minimo 12 caratteri. Lâ€™account richiede lâ€™approvazione dellâ€™amministratore.</p>
            </>
          ) : null}
          {error ? <p role="alert" className="text-sm font-semibold text-red-600">{error}</p> : null}
          {notice ? <p role="status" className="text-sm font-semibold text-emerald-700">{notice}</p> : null}
          <button type="submit" disabled={busy} className="wl-button-primary w-full px-5 py-4 text-base disabled:opacity-60">{busy ? 'Attendi...' : mode === 'login' ? 'Accedi' : 'Richiedi registrazione'}</button>
        </form>
        {guestEnabled ? (
          <div className="mt-5 border-t border-emerald-100 pt-5">
            <button type="button" onClick={() => router.push('/')} className="w-full rounded-xl border border-emerald-600 px-4 py-3 text-sm font-bold text-emerald-800">Entra come ospite</button>
            <p className="mt-2 text-xs text-gray-500">Lâ€™ingresso ospite sarÃ  operativo dopo lâ€™attivazione del nuovo sistema. Gli ospiti non possono inviare ordini.</p>
          </div>
        ) : null}
        <p className="mt-5 text-xs font-medium text-gray-400">Accesso riservato</p>
      </section>
    </main>
  );
}