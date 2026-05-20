'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { Trash2, Upload, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useGallery } from '@/lib/hooks/useGallery';

export function PhotoGallery({ eventId }: { eventId: string }) {
  const { photos, loading, upload, remove } = useGallery(eventId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    await upload(files);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-5">
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
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? 'border-rose-500 bg-rose-50'
            : 'border-border bg-muted/30 hover:border-rose-200'
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 mx-auto text-rose-500 animate-spin" />
        ) : (
          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
        )}
        <p className="mt-2 font-medium">
          {uploading ? 'Uploading…' : 'Drag & drop photos here'}
        </p>
        <p className="text-xs text-muted-foreground">
          or click below · JPG, PNG, WEBP up to 10 MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          Choose photos
        </Button>
      </div>

      {loading && (
        <p className="text-center text-muted-foreground py-6">Loading photos…</p>
      )}

      {!loading && photos.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No photos yet. Upload your first memory.
          </CardContent>
        </Card>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {photos.map((photo) => (
            <div key={photo.path} className="group relative aspect-square">
              <button
                onClick={() => setPreview(photo.url)}
                className="absolute inset-0 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <Image
                  src={photo.url}
                  alt={photo.name}
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </button>
              <Button
                size="icon"
                variant="destructive"
                className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Delete this photo?')) await remove(photo.path);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-0">
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
          {preview && (
            <div className="relative w-full" style={{ height: '80vh' }}>
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
