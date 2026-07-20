export async function GET() {
  return Response.json({
    supabaseUrlPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseAnonKeyPresent: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    serviceRoleKeyPresent: Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    adminAccessCodePresent: Boolean(
      process.env.ADMIN_ACCESS_CODE
    ),
  });
}