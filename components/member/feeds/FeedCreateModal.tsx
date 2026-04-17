'use client'

import { useRef } from 'react'
import { ImagePlusIcon, VideoIcon, XIcon, Loader2Icon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface FeedCreateModalProps {
  isOpen: boolean
  isSubmitting: boolean
  newCaption: string
  selectedFile: File | null
  previewUrl: string
  mediaType: 'image' | 'video'
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  onCaptionChange: (value: string) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFile: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function FeedCreateModal({
  isOpen,
  isSubmitting,
  newCaption,
  selectedFile,
  previewUrl,
  mediaType,
  fileInputRef,
  onClose,
  onCaptionChange,
  onFileChange,
  onClearFile,
  onSubmit,
}: FeedCreateModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isSubmitting) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md bg-white border-2 border-muted rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="font-black text-center text-xl">Buat Review Baru</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          {/* Media picker */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Gambar atau Video Sampul</label>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,video/*"
              onChange={onFileChange}
              className="hidden"
              disabled={isSubmitting}
            />

            {previewUrl ? (
              <div className="relative w-full h-56 rounded-xl overflow-hidden border-2 border-muted bg-muted/20 flex items-center justify-center">
                {mediaType === 'image' ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video
                    src={previewUrl}
                    controls
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-contain bg-black/5"
                  />
                )}
                {!isSubmitting && (
                  <Button
                    variant="destructive"
                    size="icon"
                    type="button"
                    onClick={onClearFile}
                    className="absolute top-2 right-2 size-8 rounded-full shadow-lg"
                  >
                    <XIcon className="size-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div
                onClick={() => !isSubmitting && fileInputRef.current?.click()}
                className={`w-full h-40 border-2 border-dashed border-muted rounded-xl flex flex-col items-center justify-center gap-3 bg-slate-50 text-muted-foreground transition-colors
                  ${
                    !isSubmitting
                      ? 'hover:bg-muted/10 hover:text-primary hover:border-primary/50 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
              >
                <div className="flex gap-2">
                  <ImagePlusIcon className="size-8" />
                  <VideoIcon className="size-8" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-center px-4">
                  Pilih Gambar / Video
                </p>
              </div>
            )}
          </div>

          {/* Caption textarea */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Tulis Review Kamu</label>
            <textarea
              placeholder="Bagaimana pendapatmu tentang buku ini?"
              value={newCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full min-h-[120px] p-3 text-sm bg-slate-50 border-2 border-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium placeholder:text-muted-foreground/60 leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!selectedFile || isSubmitting}
            className="w-full font-bold rounded-xl h-11 text-base shadow-none gap-2"
          >
            {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
            {isSubmitting ? 'MENGUNGGAH...' : 'POSTING REVIEW'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
