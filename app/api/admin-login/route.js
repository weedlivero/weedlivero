import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Variabili Supabase mancanti");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const code = String(body?.code || "").trim();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Inserisci la password amministratore.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: settings, error } = await supabase
      .from("settings")
      .select("admin_password_hash")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("Errore lettura impostazioni:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Impossibile verificare la password.",
        },
        { status: 500 }
      );
    }

    let passwordIsValid = false;

    if (settings?.admin_password_hash) {
      passwordIsValid = await bcrypt.compare(
        code,
        settings.admin_password_hash
      );
    } else {
      /*
       * Fallback temporaneo:
       * viene usato soltanto se nel database non esiste ancora l'hash.
       */
      const fallbackPassword =
        process.env.ADMIN_ACCESS_CODE || "ADMIN2026";

      passwordIsValid = code === fallbackPassword;
    }

    if (!passwordIsValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Password amministratore errata.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore login amministratore:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Errore interno durante il login.",
      },
      { status: 500 }
    );
  }
}