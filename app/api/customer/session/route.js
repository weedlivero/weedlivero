import { getCustomerSession, noStore } from '@/lib/customer-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return noStore({ authenticated: false });
    return noStore({
      authenticated: true,
      username: session.account.username,
      mustChangePassword: session.account.must_change_password,
    });
  } catch (error) {
    console.error('Sessione cliente:', error?.code || error?.message);
    return noStore({ error: 'Verifica sessione non disponibile.' }, 503);
  }
}
