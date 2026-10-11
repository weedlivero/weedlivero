
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const authenticated = await verifyAdminSession();

    return NextResponse.json(
      {
        authenticated,
      },
      {
        status: authenticated ? 200 : 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Errore verifica sessione amministrativa:",
      error
    );

    return NextResponse.json(
      {
        authenticated: false,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
