'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

const API = '/api/admin/finance';
const euro = (n) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);
const fmt = (n) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 3 }).format(Number(n) || 0);
const today = () => new Date().toLocaleDateString('en-CA');
const inputClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-600';
const labelClass = 'block space-y-1 text-sm font-semibold text-gray-700';
const cardClass = 'rounded-3xl bg-white p-5 shadow-sm';
const tabs = [ ['products', '📦 Prodotti'], ['purchase', '🛒 Acquisti'], ['sale', '💶 Vendite'], ['expenses', '🧾 Spese'], ['inventory', '🏬 Magazzino'], ['margins', '📊 Riepilogo'] ];

async function request(path, options) {
  const res = await fetch(`${API}/${path}`, { cache: 'no-store', credentials: 'same-origin', ...options, headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...options?.headers } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Errore HTTP ${res.status}`);
  return json;
}

export default function FinanzePage() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productForm, setProductForm] = useState({ source: 'internal', name: '', catalog_product_id: '', base_unit: 'g', sku: '', notes: '' });
  const [movementForm, setMovementForm] = useState({ product_id: '', quantity: '', unit: 'g', unit_price: '', occurred_on: today(), supplier_or_customer: '', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Trasporto', description: '', amount: '', occurred_on: today(), notes: '' });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [p, m, e] = await Promise.all([request('products'), request('movements'), request('expenses')]);
      setProducts(p.products || []); setMovements(m.movements || []); setExpenses(e.expenses || []); setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const inventory = useMemo(() => products.map(p => ({ ...p, available: movements.filter(m => m.product_id === p.id).reduce((sum, m) => sum + (['purchase', 'adjustment_in'].includes(m.kind) ? 1 : -1) * Number(m.quantity_base ?? (m.unit === 'kg' ? Number(m.quantity) * 1000 : m.quantity)), 0) })), [products, movements]);
  const totals = useMemo(() => ({ purchases: movements.filter(m => m.kind === 'purchase').reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0), sales: movements.filter(m => m.kind === 'sale').reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0), expenses: expenses.reduce((s, e) => s + Number(e.amount), 0) }), [movements, expenses]);

  async function saveProduct(e) {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      await request('products', { method: 'POST', body: JSON.stringify(productForm) });
      setSuccess('Prodotto finanziario creato correttamente.');
      setProductForm({ source: 'internal', name: '', catalog_product_id: '', base_unit: 'g', sku: '', notes: '' });
      await reload();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function saveMovement(e) {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      await request('movements', { method: 'POST', body: JSON.stringify({ ...movementForm, kind: tab }) });
      setSuccess(tab === 'purchase' ? 'Acquisto registrato.' : 'Vendita registrata.');
      setMovementForm(f => ({ ...f, quantity: '', unit_price: '', supplier_or_customer: '', notes: '' }));
      await reload();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  async function saveExpense(e) {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      await request('expenses', { method: 'POST', body: JSON.stringify(expenseForm) });
      setSuccess('Spesa registrata.');
      setExpenseForm(f => ({ ...f, description: '', amount: '', notes: '' }));
      await reload();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  const chosen = products.find(p => p.id === movementForm.product_id);
  const allowedUnits = chosen?.base_unit === 'g' ? ['g', 'kg'] : chosen?.base_unit === 'ml' ? ['ml'] : ['pcs'];
  const unitLabel = u => ({ g: 'grammi (g)', kg: 'chilogrammi (kg)', ml: 'millilitri (ml)', pcs: 'pezzi' })[u] || u;
  const productName = id => products.find(p => p.id === id)?.name || 'Prodotto non trovato';
  const selectTab = value => { setTab(value); setError(''); setSuccess(''); };

  return (
    <AdminLayout title="Gestione finanziaria">
      <div className="space-y-5">
        <div className={cardClass}>
          <h1 className="text-2xl font-black text-gray-900">💰 Gestione finanziaria e magazzino</h1>
          <p className="mt-2 text-sm text-gray-600">Gestione interna di prodotti, acquisti, vendite, spese e giacenze.</p>
          <p className="mt-2 text-xs text-amber-700">Le vendite vengono registrate manualmente: le richieste ricevute dal catalogo non riducono automaticamente il magazzino.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className={cardClass}><p className="text-xs font-semibold text-gray-500">Acquisti registrati</p><p className="mt-1 text-xl font-black">{euro(totals.purchases)}</p></div>
          <div className={cardClass}><p className="text-xs font-semibold text-gray-500">Vendite registrate</p><p className="mt-1 text-xl font-black">{euro(totals.sales)}</p></div>
          <div className={cardClass}><p className="text-xs font-semibold text-gray-500">Spese registrate</p><p className="mt-1 text-xl font-black">{euro(totals.expenses)}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map(([key, name]) => <button key={key} type="button" onClick={() => selectTab(key)} className={`rounded-2xl px-3 py-2 text-sm font-bold transition ${tab === key ? 'bg-green-700 text-white' : 'bg-white text-gray-700 hover:bg-green-50'}`}>{name}</button>)}
          <button type="button" onClick={reload} className="rounded-2xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">↻ Aggiorna</button>
        </div>
        {loading && <p className="text-sm text-gray-600">Caricamento dati…</p>}
        {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        {success && <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">{success}</div>}

        {tab === 'products' && <div className="space-y-4">
          <form onSubmit={saveProduct} className={`${cardClass} space-y-4`}>
            <h2 className="text-lg font-black">Aggiungi prodotto alla gestione interna</h2>
            <label className={labelClass}>Origine<select className={inputClass} value={productForm.source} onChange={e => setProductForm(f => ({ ...f, source: e.target.value, catalog_product_id: '' }))}><option value="internal">Prodotto indipendente (non visibile nel catalogo)</option><option value="catalog">Prodotto già presente nel catalogo</option></select></label>
            {productForm.source === 'catalog' && <label className={labelClass}>Codice esatto del prodotto nel catalogo<input required className={inputClass} placeholder="Es. WD-002" value={productForm.catalog_product_id} onChange={e => setProductForm(f => ({ ...f, catalog_product_id: e.target.value }))}/><span className="block text-xs font-normal text-gray-500">Il codice deve già esistere nel catalogo. Il server ne verifica l'esistenza.</span></label>}
            <label className={labelClass}>Nome prodotto<input required maxLength={200} className={inputClass} value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}/></label>
            <label className={labelClass}>Unità base di magazzino<select className={inputClass} value={productForm.base_unit} onChange={e => setProductForm(f => ({ ...f, base_unit: e.target.value }))}><option value="g">Grammi (consente acquisti anche in kg)</option><option value="ml">Millilitri</option><option value="pcs">Pezzi</option></select></label>
            <label className={labelClass}>Codice interno (facoltativo)<input className={inputClass} value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))}/></label>
            <button disabled={saving} className="rounded-2xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvataggio…' : 'Salva prodotto'}</button>
          </form>
          <div className={cardClass}><h2 className="mb-3 text-lg font-black">Prodotti gestiti ({products.length})</h2><div className="space-y-2">{products.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 p-3 text-sm"><div><strong>{p.name}</strong><p className="text-xs text-gray-500">{p.source === 'catalog' ? `Catalogo · ${p.catalog_product_id}` : 'Solo gestione interna'} · {unitLabel(p.base_unit)}</p></div><span className="font-bold">{fmt(inventory.find(i => i.id === p.id)?.available)} {p.base_unit}</span></div>)}{!products.length && <p className="text-sm text-gray-500">Nessun prodotto finanziario ancora inserito.</p>}</div></div>
        </div>}

        {(tab === 'purchase' || tab === 'sale') && <div className="space-y-4">
          <form onSubmit={saveMovement} className={`${cardClass} space-y-4`}>
            <h2 className="text-lg font-black">{tab === 'purchase' ? 'Registra un acquisto' : 'Registra una vendita'}</h2>
            <label className={labelClass}>Prodotto<select required className={inputClass} value={movementForm.product_id} onChange={e => { const p = products.find(x => x.id === e.target.value); setMovementForm(f => ({ ...f, product_id: e.target.value, unit: p?.base_unit || 'g' })); }}><option value="">Seleziona un prodotto</option>{products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.source === 'catalog' ? 'catalogo' : 'interno'})</option>)}</select></label>
            <div className="grid gap-3 sm:grid-cols-2"><label className={labelClass}>Quantità<input required type="number" min="0.001" step="0.001" className={inputClass} value={movementForm.quantity} onChange={e => setMovementForm(f => ({ ...f, quantity: e.target.value }))}/></label><label className={labelClass}>Unità<select className={inputClass} value={movementForm.unit} onChange={e => setMovementForm(f => ({ ...f, unit: e.target.value }))}>{allowedUnits.map(u => <option key={u} value={u}>{unitLabel(u)}</option>)}</select></label></div>
            <label className={labelClass}>Prezzo per {unitLabel(movementForm.unit)} (€)<input required type="number" min="0" step="0.0001" className={inputClass} value={movementForm.unit_price} onChange={e => setMovementForm(f => ({ ...f, unit_price: e.target.value }))}/></label>
            <div className="rounded-xl bg-gray-50 p-3 text-sm font-semibold">Totale movimento: {euro(Number(movementForm.quantity) * Number(movementForm.unit_price))}</div>
            <label className={labelClass}>Data<input required type="date" className={inputClass} value={movementForm.occurred_on} onChange={e => setMovementForm(f => ({ ...f, occurred_on: e.target.value }))}/></label>
            <label className={labelClass}>{tab === 'purchase' ? 'Fornitore (facoltativo)' : 'Cliente o riferimento (facoltativo)'}<input className={inputClass} value={movementForm.supplier_or_customer} onChange={e => setMovementForm(f => ({ ...f, supplier_or_customer: e.target.value }))}/></label>
            <label className={labelClass}>Note (facoltative)<textarea className={inputClass} rows={2} value={movementForm.notes} onChange={e => setMovementForm(f => ({ ...f, notes: e.target.value }))}/></label>
            <p className="text-xs text-amber-700">Attenzione: in questa fase le API non impediscono ancora vendite superiori alla giacenza. Controlla il magazzino prima di registrare una vendita.</p>
            <button disabled={saving || !products.length} className="rounded-2xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvataggio…' : 'Registra movimento'}</button>
          </form>
          <div className={cardClass}><h2 className="mb-3 text-lg font-black">Ultimi movimenti</h2><div className="space-y-2">{movements.filter(m => m.kind === tab).slice(0, 30).map(m => <div key={m.id} className="flex flex-wrap justify-between gap-2 border-b border-gray-100 py-2 text-sm"><div><strong>{productName(m.product_id)}</strong><p className="text-xs text-gray-500">{m.occurred_on} · {fmt(m.quantity)} {m.unit}</p></div><strong>{euro(Number(m.quantity) * Number(m.unit_price))}</strong></div>)}{!movements.some(m => m.kind === tab) && <p className="text-sm text-gray-500">Nessun movimento registrato.</p>}</div></div>
        </div>}

        {tab === 'expenses' && <div className="space-y-4"><form onSubmit={saveExpense} className={`${cardClass} space-y-4`}><h2 className="text-lg font-black">Registra una spesa</h2><label className={labelClass}>Categoria<input required maxLength={200} list="finance-categories" className={inputClass} value={expenseForm.category} onChange={e => setExpenseForm(f => ({ ...f, category: e.target.value }))}/><datalist id="finance-categories"><option value="Trasporto"/><option value="Imballaggi"/><option value="Materiali"/><option value="Servizi"/><option value="Altro"/></datalist></label><label className={labelClass}>Descrizione<input required maxLength={500} className={inputClass} value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}/></label><label className={labelClass}>Importo (€)<input required type="number" min="0.01" step="0.01" className={inputClass} value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}/></label><label className={labelClass}>Data<input required type="date" className={inputClass} value={expenseForm.occurred_on} onChange={e => setExpenseForm(f => ({ ...f, occurred_on: e.target.value }))}/></label><label className={labelClass}>Note<textarea className={inputClass} rows={2} value={expenseForm.notes} onChange={e => setExpenseForm(f => ({ ...f, notes: e.target.value }))}/></label><button disabled={saving} className="rounded-2xl bg-green-700 px-5 py-3 font-bold text-white disabled:opacity-50">{saving ? 'Salvataggio…' : 'Registra spesa'}</button></form><div className={cardClass}><h2 className="mb-3 text-lg font-black">Spese recenti</h2>{expenses.slice(0, 30).map(e => <div key={e.id} className="flex justify-between gap-3 border-b border-gray-100 py-2 text-sm"><div><strong>{e.description}</strong><p className="text-xs text-gray-500">{e.occurred_on} · {e.category}</p></div><strong>{euro(e.amount)}</strong></div>)}{!expenses.length && <p className="text-sm text-gray-500">Nessuna spesa registrata.</p>}</div></div>}

        {tab === 'inventory' && <div className={cardClass}><h2 className="mb-2 text-lg font-black">Giacenze di magazzino</h2><p className="mb-4 text-xs text-gray-500">Giacenze calcolate dai movimenti caricati (massimo 500 movimenti). Non utilizzare come inventario definitivo quando lo storico supera tale limite.</p><div className="space-y-2">{inventory.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 p-3 text-sm"><div><strong>{p.name}</strong><p className="text-xs text-gray-500">{p.source === 'catalog' ? 'Catalogo' : 'Interno'} · unità base {p.base_unit}</p></div><span className={`font-black ${p.available < 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt(p.available)} {p.base_unit}</span></div>)}{!inventory.length && <p className="text-sm text-gray-500">Aggiungi un prodotto per iniziare.</p>}</div></div>}

        {tab === 'margins' && <div className={`${cardClass} space-y-4`}><h2 className="text-lg font-black">Riepilogo economico</h2><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Acquisti</p><strong>{euro(totals.purchases)}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Vendite</p><strong>{euro(totals.sales)}</strong></div><div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Spese</p><strong>{euro(totals.expenses)}</strong></div></div><p className="text-sm text-amber-700">Il margine reale richiede il calcolo del costo dei prodotti effettivamente venduti (costo del venduto), non la sottrazione di tutti gli acquisti. Il calcolo dei margini sarà aggiunto in una fase successiva.</p><p className="text-xs text-gray-500">I riepiloghi mostrano fino a 500 movimenti e 500 spese per tipo. Non costituiscono un rendiconto fiscale.</p></div>}
      </div>
    </AdminLayout>
  );
}
