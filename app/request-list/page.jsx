import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin-session';
import { getCatalogAccess } from '@/lib/catalog-access';
import RequestListClient from './RequestListClient';

export const dynamic = 'force-dynamic';

export default async function RequestListPage() {
  let orderAccessMode = 'legacy';

  if (process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true') {
    const access = await getCatalogAccess();

    if (access.role === 'customer') {
      // Una sessione cliente valida ha precedenza ai soli fini degli ordini.
      orderAccessMode = 'customer';
    } else {
      const isAdmin = await verifyAdminSession();

      if (isAdmin) {
        // La sola sessione amministratore non autorizza gli ordini.
        orderAccessMode = 'admin';
      } else if (access.allowed) {
        orderAccessMode = 'guest';
      } else {
        redirect('/access');
      }
    }
  }

  return <RequestListClient orderAccessMode={orderAccessMode} />;
}
