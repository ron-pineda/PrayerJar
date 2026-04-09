'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImageFile, compressImage } from '@/lib/image-utils';

type PhotoUploadProps = {
  onUpload: (url: string) => void;
  onRemove: () => void;
  url: string | null;
  variant?: 'neutral' | 'warm';
};

export function PhotoUpload({ onUpload, onRemove, url, variant = 'neutral' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);
    let previewUrl: string | null = null;

    try {
      previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      const compressed = await compressImage(file);

      const formData = new FormData();
      formData.set('file', compressed, 'photo.webp');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Upload failed');
      }

      const { url: blobUrl } = await res.json();
      onUpload(blobUrl);
      if (inputRef.current) inputRef.current.value = '';

      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    } catch (err) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayUrl = url || preview;

  if (displayUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border">
        <img src={displayUrl} alt="Attached photo" className="w-full h-48 object-cover" />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2 h-7 w-7 p-0"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
    );
  }

  const warmClasses = variant === 'warm'
    ? 'border-primary/30 bg-primary/5'
    : '';

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 ${warmClasses}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
        )}
        <p className={`mt-2 text-sm ${variant === 'warm' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          {variant === 'warm'
            ? 'Add a celebration photo'
            : 'Add a photo'}
          <span className="text-muted-foreground font-normal"> (optional)</span>
        </p>
        {variant === 'warm' && (
          <p className="text-xs text-muted-foreground mt-1">A photo makes your testimony more powerful</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Max 5MB · JPG, PNG, WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
