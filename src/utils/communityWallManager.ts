import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://znzrepbljbywusntjkfx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuenJlcGJsamJ5d3VzbnRqa2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0Mjk1NjMsImV4cCI6MjA2NjAwNTU2M30.6K3AgL5mOyxugPtJ_o6Hgarbx8Sc9eDgIUK4zLG813c'
);

const TABLE = 'wall_messages';

export async function postMessageToServer({
  pointId,
  message,
  withImage,
  imageUrl
}: {
  pointId: string;
  message: string;
  withImage: boolean;
  imageUrl: string;
}) {
  const { error } = await supabase.from(TABLE).insert([
    {
      point_id: pointId,
      message,
      url: imageUrl,
      has_image: withImage
    }
  ]);
  if (error) throw error;
}
