'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDocuments } from '@/lib/hooks/useDocuments';
import type { DocumentCategory } from '@/lib/types/database.types';

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'guest_list', label: 'Guest list' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

export function DocumentUpload({ eventId }: { eventId: string }) {
  const { uploadFile } = useDocuments(eventId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>('contract');
  const [dragOver, setDragOver] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    startTransition(async () => {
      let success = 0;
      for (const file of Array.from(files)) {
        const result = await uploadFile(file, { eventId, category });
        if (result) success += 1;
      }
      if (success > 0)
        toast.success(`Uploaded ${success} ${success === 1 ? 'file' : 'files'}`);
      if (inputRef.current) inputRef.current.value = '';
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <Label className="text-xs">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as DocumentCategory)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragOver
            ? 'border-rose-500 bg-rose-50'
            : 'border-border bg-muted/30 hover:border-rose-200'
        }`}
      >
        {isPending ? (
          <Loader2 className="h-8 w-8 mx-auto text-rose-500 animate-spin" />
        ) : (
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        )}
        <p className="mt-3 font-medium">
          {isPending ? 'Uploading…' : 'Drag & drop files here'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click below to choose · Max 10MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
        >
          Choose files
        </Button>
      </div>
    </div>
  );
}
