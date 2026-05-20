'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

const BUCKET = 'event-photos';
const MAX_BYTES = 10 * 1024 * 1024;

export interface GalleryPhoto {
  name: string;
  path: string;
  url: string;
  size: number;
  updatedAt: string;
}

export function useGallery(eventId: string) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(eventId, { sortBy: { column: 'created_at', order: 'desc' } });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const photos: GalleryPhoto[] = (data ?? [])
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => {
        const path = `${eventId}/${f.name}`;
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);
        return {
          name: f.name,
          path,
          url: urlData.publicUrl,
          size: f.metadata?.size ?? 0,
          updatedAt: f.updated_at ?? f.created_at ?? '',
        };
      });
    setPhotos(photos);
    setLoading(false);
  }, [supabase, eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    let success = 0;
    for (const file of list) {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is too large (max 10 MB)`);
        continue;
      }
      const safe = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const path = `${eventId}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      success += 1;
    }
    if (success > 0) toast.success(`Uploaded ${success} photo${success > 1 ? 's' : ''}`);
    await refresh();
  }

  async function remove(path: string) {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Photo deleted');
    await refresh();
    return true;
  }

  return { photos, loading, upload, remove, refresh };
}
