'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useOptionalWorkspace } from '@/lib/hooks/useWorkspace';
import type {
  DocumentRow,
  DocumentCategory,
} from '@/lib/types/database.types';

const BUCKET = 'event-documents';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export function useDocuments(eventId?: string) {
  const supabase = createClient();
  const ws = useOptionalWorkspace();
  const workspaceId = ws?.activeWorkspaceId ?? null;
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocs = useCallback(async () => {
    if (!eventId && !workspaceId) {
      setDocuments([]);
      setLoading(false);
      return;
    }
    const query = eventId
      ? supabase
          .from('documents')
          .select('*')
          .eq('event_id', eventId)
          .order('created_at', { ascending: false })
      : supabase
          .from('documents')
          .select('*')
          .eq('workspace_id', workspaceId!)
          .order('created_at', { ascending: false });
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setDocuments(data ?? []);
    setLoading(false);
  }, [supabase, eventId, workspaceId]);

  useEffect(() => {
    fetchDocs();
    const channel = supabase
      .channel(`documents-changes-${crypto.randomUUID()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        () => fetchDocs()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchDocs]);

  async function uploadFile(
    file: File,
    options: { eventId: string; category: DocumentCategory }
  ) {
    if (file.size > MAX_BYTES) {
      toast.error('File too large (max 10 MB)');
      return null;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${options.eventId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data: row, error: insertError } = await supabase
      .from('documents')
      .insert({
        event_id: options.eventId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        storage_path: path,
        file_type: file.type,
        file_size: file.size,
        category: options.category,
        uploaded_by: user?.id ?? null,
        workspace_id: workspaceId,
      })
      .select()
      .single();

    if (insertError) {
      toast.error(insertError.message);
      return null;
    }

    toast.success(`${file.name} uploaded`);
    return row;
  }

  async function deleteDocument(doc: DocumentRow) {
    if (doc.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([doc.storage_path]);
      if (storageError) {
        toast.error(storageError.message);
        return false;
      }
    }
    const { error } = await supabase.from('documents').delete().eq('id', doc.id);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success('Document deleted');
    return true;
  }

  return {
    documents,
    loading,
    uploadFile,
    deleteDocument,
    refresh: fetchDocs,
  };
}
