import { endCustomerSession, isSameOrigin, noStore } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!isSameOrigin(request)) return noStore({ error: 'Origine non autorizzata.' }, 403);
  try {
    await endCustomerSession();
    return noStore({ success: true });
  } catch (error) {
    console.error('Logout cliente:', error?.code || error?.message);
    return noStore({ error: 'Revoca sessione non riuscita.' }, 500);
  }
}
