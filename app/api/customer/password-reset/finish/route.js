import { createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { customerDb, customerLimit, isSameOrigin, noStore, trustedClientIp } from '@/lib/customer-auth';
export const runtime='nodejs'; export const dynamic='force-dynamic';
const hash=(x)=>createHash('sha256').update(x).digest('hex');
export async function POST(request) {
 if(process.env.CUSTOMER_LOGIN_ENABLED!=='true') return noStore({error:'Recupero non disponibile.'},503);
 if(!isSameOrigin(request)) return noStore({error:'Origine non autorizzata.'},403);
 if(!(request.headers.get('content-type')||'').startsWith('application/json')) return noStore({error:'Formato non valido.'},415);
 try {
  const ip=trustedClientIp(request);if(!ip)return noStore({error:'Richiesta non verificabile.'},503);
  const db=customerDb();const allowed=await customerLimit(db,'customer_password_reset_finish_ip',ip,10);
  if(allowed===null)return noStore({error:'Protezione non disponibile.'},503);
  if(!allowed)return noStore({error:'Troppi tentativi.'},429);
  const raw=await request.text();if(raw.length>2048)return noStore({error:'Richiesta troppo grande.'},413);
  const {verificationToken,password}=JSON.parse(raw);
  if(typeof verificationToken!=='string'|| !/^[a-f0-9]{64}$/.test(verificationToken)||typeof password!=='string'||password.length<8||password.length>128) return noStore({error:'Token o password non validi (8-128 caratteri).'},400);
  const passwordHash=await bcrypt.hash(password,12);
  const {data,error}=await db.rpc('customer_finish_telegram_password_reset',{p_token_hash:hash(verificationToken),p_password_hash:passwordHash});
  if(error){console.error('reset finish',error.code);return noStore({error:'Recupero non disponibile.'},503);}
  if(data!==true)return noStore({error:'Verifica scaduta o già utilizzata. Ricomincia.'},400);
  return noStore({success:true,message:'Password aggiornata. Accedi con la nuova password.'});
 }catch(e){if(e instanceof SyntaxError)return noStore({error:'JSON non valido.'},400);console.error('reset finish',e?.code||e?.message);return noStore({error:'Errore interno.'},500);}
}
