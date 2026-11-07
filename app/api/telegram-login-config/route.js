export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const username = process.env.TELEGRAM_VERIFY_BOT_USERNAME || '';

  if (!/^[A-Za-z0-9_]{5,32}$/.test(username)) {
    return Response.json(
      { error: 'Bot Telegram non configurato.' },
      { status: 503 }
    );
  }

  return Response.json(
    { botUsername: username },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
