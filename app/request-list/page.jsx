import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin-session';
import { getCatalogAccess } from '@/lib/catalog-access';
import RequestListClient from './RequestListClient';

export const dynamic = 'force-dynamic';

export default async function RequestListPage() {
  let orderAccessMode = 'legacy';
  if (process.env.CUSTOMER_CATALOG_PROTECTION_ENABLED === 'true') {
    const isAdmin = await verifyAdminSession();
    if (isAdmin) {
      orderAccessMode = 'admin';
    } else {
      const access = await getCatalogAccess();
      if (!access.allowed) redirect('/access');
      orderAccessMode = access.role === 'customer' ? 'customer' : 'guest';
    }
  }
  return <RequestListClient orderAccessMode={orderAccessMode} />;
}