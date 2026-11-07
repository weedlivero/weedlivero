'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function PasswordResetPage() {
 const [phase,setPhase]=useState('start');
 const [request,setRequest]=useState(null);
 const [token,setToken]=useState('');
 const [password,setPassword]=useState('');
 const [confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const timer=useRef(null);
 const running=useRef(false);
 useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);},[]);
 async function post(path,payload){
  const response=await fetch('/api/customer/password-reset/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
  const data=await response.json(); if(!response.ok)throw new Error(data.error||'Operazione non riuscita.');return data;
 }
 async function start(){
  const popup=window.open('about:blank','_blank');
  setBusy(true);setError('');setMessage('');
  if(timer.current)clearInterval(timer.current);
  try{
   const data=await post('start',{});setRequest(data);setPhase('verify');setMessage('Apri Telegram e premi Avvia nel bot.');
   if(popup)popup.location.replace(data.botUrl);
   timer.current=setInterval(async()=>{
    if(running.current)return;running.current=true;
    try{
     if(Date.now()>=new Date(data.expiresAt).getTime())throw new Error('Verifica scaduta. Ricomincia.');
     const status=await post('status',{requestCode:data.requestCode,browserSecret:data.browserSecret});
     if(status.status==='expired')throw new Error('Verifica scaduta. Ricomincia.');
     if(status.status!=='verified')return;
     clearInterval(timer.current);timer.current=null;
     const result=await post('complete',{requestCode:data.requestCode,browserSecret:data.browserSecret});
     setToken(result.verificationToken);setPhase('password');setMessage('Identità Telegram verificata. Scegli una nuova password.');
    }catch(e){if(timer.current)clearInterval(timer.current);timer.current=null;setError(e.message||'Errore di verifica.');setPhase('start');setRequest(null);}
    finally{running.current=false;}
   },10000);
  }catch(e){if(popup)popup.close();setError(e.message||'Errore di connessione.');}
  finally{setBusy(false);}
 }
 async function finish(e){
  e.preventDefault();setError('');setMessage('');
  if(password!==confirm){setError('Le password non coincidono.');return;}
  setBusy(true);
  try{const result=await post('finish',{verificationToken:token,password});setPassword('');setConfirm('');setToken('');setPhase('done');setMessage(result.message||'Password aggiornata.');}
  catch(e){setError(e.message||'Impossibile aggiornare la password.');}
  finally{setBusy(false);}
 }
 return <main className="relative flex min-h-screen items-center justify-center px-5 py-10 bg-emerald-50">
  <section className="wl-card w-full max-w-sm rounded-[2rem] p-7 text-center sm:p-8">
   <h1 className="text-xl font-black text-gray-900">Recupera la password</h1>
   <p className="mt-3 text-sm text-gray-600">Conferma la tua identità con il Telegram associato al tuo account Weedlivero.</p>
   {phase==='start'&&<button type="button" disabled={busy} onClick={start} className="wl-button-primary mt-6 w-full px-4 py-3 disabled:opacity-60">{busy?'Attendi...':'Verificati con Telegram'}</button>}
   {phase==='verify'&&<div className="mt-6 space-y-3"><p className="text-sm text-gray-700">In attesa della verifica Telegram…</p><a href={request?.botUrl} target="_blank" rel="noopener noreferrer" className="block text-emerald-700 underline">Apri @WLIVERO_Verify_2_Bot</a><button type="button" onClick={()=>{if(timer.current)clearInterval(timer.current);setPhase('start');setRequest(null);setError('');}} className="text-sm underline">Ricomincia</button></div>}
   {phase==='password'&&<form onSubmit={finish} className="mt-6 space-y-3 text-left">
    <label htmlFor="new-password" className="block text-sm font-semibold">Nuova password</label>
    <input id="new-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="wl-input w-full px-4 py-3" value={password} onChange={e=>setPassword(e.target.value)}/>
    <label htmlFor="confirm-password" className="block text-sm font-semibold">Conferma password</label>
    <input id="confirm-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="wl-input w-full px-4 py-3" value={confirm} onChange={e=>setConfirm(e.target.value)}/>
    <button type="submit" disabled={busy} className="wl-button-primary w-full px-4 py-3 disabled:opacity-60">{busy?'Attendi...':'Salva nuova password'}</button>
   </form>}
   {error&&<p role="alert" className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
   {message&&<p role="status" className="mt-4 text-sm text-emerald-800">{message}</p>}
   <Link href="/access" className="mt-6 block text-sm font-semibold text-emerald-700 underline">{phase==='done'?'Torna al login':'Torna alla schermata di accesso'}</Link>
  </section>
 </main>;
}
