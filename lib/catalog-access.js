import 'server-only';
import { customerDb, getCustomerSession } from '@/lib/customer-auth';

/**
 * Controllo server-side di accesso in sola lettura al catalogo.
 * Non sostituisce la protezione delle API o dello storage.
 * Non usare il risultato per autorizzare ordini: serve una sessione cliente.
 */
export async function getCatalogAccess() {
  try {
    const session = await getCustomerSession();
    if (session && session.account.must_change_password !== true) {
      return { allowed: true, role: 'customer' };
    }

    const db = customerDb();
    const { data, error } = await db
      .from('settings')
      .select('guest_access_enabled')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.error('Accesso catalogo: impostazioni non disponibili', error?.code || 'missing');
      return { allowed: false, role: 'none' };
    }

    if (data.guest_access_enabled === true) {
      return { allowed: true, role: 'guest' };
    }

    return { allowed: false, role: 'none' };
  } catch (error) {
    console.error('Accesso catalogo: verifica fallita', error?.code || error?.message);
    return { allowed: false, role: 'none' };
  }
}
