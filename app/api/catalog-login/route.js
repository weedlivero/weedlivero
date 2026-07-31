import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function POST(req) {
  const { code } = await req.json();

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("settings")
    .select("catalog_access_code")
    .eq("id", 1)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success:
      code.trim() === data.catalog_access_code,
  });
}