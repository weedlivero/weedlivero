import { createHash } from 'node:crypto';
import { customerDb, customerLimit, isSameOrigin, noStore, trustedClientIp } from '@/lib/customer-auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const hash = (x) => createHash('sha256').update(x).digest('hex');
export async function POST(request) {
 if (process.env.CUSTOMER_LOGIN_ENABLED !== 'true') return noStore({error:'Recupero non disponibile.'},503);
 if (!isSameOrigin(request)) return noStore({error:'Origine non autorizzata.'},403);
 if (!(request.headers.get('content-type')||'').startsWith('application/json')) return noStore({error:'Formato non valido.'},415);
 try {
  const ip=trustedClientIp(request); if(!ip) return noStore({error:'Richiesta non verificabile.'},503);
  const db=customerDb(); const allowed=await customerLimit(db,'customer_password_reset_status_ip',ip,120);
  if(allowed===null) return noStore({error:'Protezione non disponibile.'},503);
  if(!allowed) return noStore({error:'Troppi tentativi.'},429);
  const raw=await request.text(); if(raw.length>1024) return noStore({error:'Richiesta troppo grande.'},413);
  const {requestCode,browserSecret}=JSON.parse(raw);
  if(typeof requestCode!=='string'|| !/^[A-Za-z0-9_-]{32}$/.test(requestCode)||typeof browserSecret!=='string'|| !/^[a-f0-9]{64}$/.test(browserSecret)) return noStore({error:'Codici non validi.'},400);
  const {data,error}=await db.from('customer_telegram_bot_requests').select('status,expires_at').eq('request_hash',hash(requestCode)).eq('browser_secret_hash',hash(browserSecret)).maybeSingle();
  if(error) return noStore({error:'Verifica non disponibile.'},503);
  if(!data) return noStore({status:'expired'});
  if(new Date(data.expires_at).getTime()<=Date.now()) return noStore({status:'expired'});
  return noStore({status: data.status==='verified'?'verified':data.status==='pending'?'pending':'expired'});
 } catch(e) { if(e instanceof SyntaxError) return noStore({error:'JSON non valido.'},400); console.error('reset status',e?.code||e?.message); return noStore({error:'Errore interno.'},500); }
}
