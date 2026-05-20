'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  File,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { formatDate } from '@/lib/utils/formatting';
import type { DocumentCategory, DocumentRow } from '@/lib/types/database.types';

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  contract: 'Contract',
  invoice: 'Invoice',
  inspiration: 'Inspiration',
  guest_list: 'Guest list',
  photo: 'Photo',
  other: 'Other',
};

function isImage(doc: DocumentRow) {
  return Boolean(doc.file_type?.startsWith('image/'));
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentList({ eventId }: { eventId: string }) {
  const { documents, loading, deleteDocument } = useDocuments(eventId);
  const [filter, setFilter] = useState<DocumentCategory | 'all'>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return documents;
    return documents.filter((d) => d.category === filter);
  }, [documents, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">
          {filtered.length} {filtered.length === 1 ? 'document' : 'documents'}
        </h2>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as DocumentCategory | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-3 w-3 mr-1.5 opacity-50" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-8">Loading…</p>
      )}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No documents yet. Drag & drop above to upload.
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((doc) => (
            <Card key={doc.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted relative">
                {isImage(doc) ? (
                  <Image
                    src={doc.file_url}
                    alt={doc.file_name}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {doc.file_type?.includes('pdf') ? (
                      <FileText className="h-12 w-12 text-rose-500" />
                    ) : (
                      <File className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <div>
                  <p className="font-medium text-sm truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {CATEGORY_LABELS[doc.category]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatSize(doc.file_size)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(doc.created_at)}
                  </p>
                </div>

                <div className="flex gap-1 pt-2 border-t">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> View
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs"
                  >
                    <a href={doc.file_url} download={doc.file_name}>
                      <Download className="h-3 w-3 mr-1" /> Save
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={async () => {
                      if (confirm(`Delete ${doc.file_name}?`)) {
                        await deleteDocument(doc);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
