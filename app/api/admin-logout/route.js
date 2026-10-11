
import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    clearAdminSession();

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Errore logout amministratore:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Impossibile completare il logout.",
      },
      { status: 500 }
    );
  }
}
