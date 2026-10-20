'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const labels = { pending: 'In attesa', approved: 'Approvato', rejected: 'Rifiutato' };
const actions = {
  pending: [{ key: 'approve', label: 'Approva' }, { key: 'reject', label: 'Rifiuta' }],
  approved: [{ key: 'suspend', label: 'Sospendi' }, { key: 'reactivate', label: 'Riattiva' }],
  rejected: [],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/admin/customers', { cache: 'no-store' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Errore caricamento');
      setUsers(data.users || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  async function apply(user, action) {
    const verb = { approve: 'approvare', reject: 'rifiutare', suspend: 'sospendere', reactivate: 'riattivare' }[action];
    if (!window.confirm(`Vuoi ${verb} l’utente ${user.username}?`)) return;
    setBusy(user.id); setError('');
    try {
      const r = await fetch('/api/admin/customers', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Operazione non riuscita');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }
  const pending = users.filter(u => u.approval_status === 'pending').length;
  return <AdminLayout title="Gestione utenti">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-black text-gray-900">Gestione utenti</h1>
        <p className="mt-2 text-gray-500">Registrazioni, approvazioni e sospensioni</p></div>
      <button onClick={load} disabled={loading || !!busy} className="rounded-2xl bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-50">Aggiorna</button>
    </div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl bg-white p-6 shadow-md"><p className="font-bold text-gray-400">Utenti totali</p><p className="mt-2 text-3xl font-black text-gray-900">{users.length}</p></div>
      <div className="rounded-3xl bg-amber-50 p-6 shadow-md"><p className="font-bold text-amber-700">In attesa</p><p className="mt-2 text-3xl font-black text-amber-800">{pending}</p></div>
    </div>
    {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-red-700">{error}</p>}
    {loading ? <p className="text-gray-500">Caricamento utenti...</p> : users.length === 0 ?
      <div className="rounded-3xl bg-white p-6 text-gray-500 shadow-md">Nessuna registrazione presente.</div> :
      <div className="grid gap-3">{users.map(u => <div key={u.id} className="rounded-3xl bg-white p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3"><div>
          <p className="font-black text-gray-900">{u.username}</p>
          <p className="text-sm text-gray-500">Registrato: {new Date(u.created_at).toLocaleDateString('it-IT')}</p>
          <p className="text-sm text-gray-600">{labels[u.approval_status] || u.approval_status}{u.approval_status === 'approved' && !u.is_active ? ' · Sospeso' : ''}</p>
        </div><div className="flex flex-wrap gap-2">{(actions[u.approval_status] || []).filter(a =>
          u.approval_status !== 'approved' || (u.is_active ? a.key === 'suspend' : a.key === 'reactivate')
        ).map(a => <button key={a.key} disabled={!!busy} onClick={() => apply(u, a.key)}
          className="rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-800 disabled:opacity-50">{a.label}</button>)}</div></div>
      </div>)}</div>}
    <p className="mt-6 text-xs text-gray-500">Le password non sono visibili. Il ripristino password sarà aggiunto in un passaggio successivo.</p>
  </AdminLayout>;
}
