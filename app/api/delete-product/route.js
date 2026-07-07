import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { id, image_path, video_path } = await request.json();

    if (!id) {
      return Response.json({ error: 'ID prodotto mancante' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json(
        { error: 'Configurazione Supabase mancante' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const filesToRemove = [image_path, video_path].filter(Boolean);

    if (filesToRemove.length > 0) {
      await supabaseAdmin.storage
        .from('product-media')
        .remove(filesToRemove);
    }

    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}