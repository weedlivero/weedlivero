export async function POST(request) {
  const { code } = await request.json();

  const validCode = process.env.ADMIN_ACCESS_CODE || 'ADMIN2026';

  if (code === validCode) {
    return Response.json({ success: true });
  }

  return Response.json(
    { success: false, error: 'Codice admin non valido' },
    { status: 401 }
  );
}