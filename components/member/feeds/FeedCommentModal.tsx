'use client'

import {
  HeartIcon,
  MessageCircleIcon,
  SendIcon,
  BookmarkIcon,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatTimeAgo } from './feed.utils'
import type { FeedPost } from '@/types'

interface FeedCommentModalProps {
  post: FeedPost | null
  commentInput: string
  currentUser: { imageUrl?: string; username?: string } | null
  onClose: () => void
  onCommentChange: (value: string) => void
  onCommentSubmit: (e: React.FormEvent) => void
  onLike: () => void
}

export function FeedCommentModal({
  post,
  commentInput,
  currentUser,
  onClose,
  onCommentChange,
  onCommentSubmit,
  onLike,
}: FeedCommentModalProps) {
  return (
    <Dialog open={!!post} onOpenChange={(open) => !open && onClose()}>
      {post && (
        <DialogContent
          className="p-0 gap-0 overflow-hidden border-2 border-muted bg-white
            sm:max-w-4xl sm:flex-row sm:h-[80vh] sm:rounded-2xl
            flex flex-col max-sm:w-full max-sm:h-[80vh] max-sm:mt-auto max-sm:mb-0 max-sm:bottom-0 max-sm:top-auto max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none"
        >
          {/* Left: media (desktop only) */}
          <div className="hidden sm:flex w-[55%] bg-black items-center justify-center border-r-2 border-muted relative">
            {post.media_type === 'image' ? (
              <img
                src={post.media_url ?? undefined}
                alt="Post Media"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={post.media_url ?? undefined}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {/* Right: comments panel */}
          <div className="w-full sm:w-[45%] flex flex-col h-full bg-white relative">
            <DialogHeader className="p-4 border-b-2 border-muted bg-white shrink-0 flex flex-row items-center justify-between">
              <DialogTitle className="text-base font-black text-center w-full">Komentar</DialogTitle>
            </DialogHeader>

            {/* Scrollable comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
              {/* Original post caption */}
              <div className="flex gap-3">
                <Avatar className="size-8 border border-muted shrink-0">
                  <AvatarImage src={post.anggota?.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {(post.anggota?.username || post.anggota?.nama_anggota || 'U')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <span className="font-bold text-foreground mr-2">
                    {post.anggota?.username || post.anggota?.nama_anggota?.split(' ')[0]}
                  </span>
                  <span className="font-medium text-slate-700 leading-relaxed">{post.caption}</span>
                  <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase">
                    {formatTimeAgo(post.created_at)}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-muted/50 w-full" />

              {/* All comments */}
              {post.feed_comments?.map((comment) => (
                <div key={comment.id_comment} className="flex gap-3">
                  <Avatar className="size-8 border border-muted shrink-0">
                    <AvatarImage src={comment.anggota?.avatar_url ?? undefined} />
                    <AvatarFallback>{(comment.anggota?.username || 'U')[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <span className="font-bold text-foreground mr-2">
                      {comment.anggota?.username || 'Member'}
                    </span>
                    <span className="font-medium text-slate-700 leading-relaxed">
                      {comment.comment_text}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer: actions + comment form */}
            <div className="shrink-0 bg-white border-t-2 border-muted">
              {/* Like / comment / share action bar (desktop only) */}
              <div className="hidden sm:flex items-center justify-between p-4 border-b-2 border-muted/30">
                <div className="flex items-center gap-4">
                  <button onClick={onLike} className="hover:scale-110 transition-transform">
                    <HeartIcon
                      className={`size-6 ${
                        post.is_liked ? 'fill-primary text-primary' : 'text-foreground'
                      }`}
                    />
                  </button>
                  <MessageCircleIcon className="size-6 text-foreground" />
                  <SendIcon className="size-5 text-foreground" />
                </div>
                <BookmarkIcon className="size-6 text-foreground" />
              </div>

              {/* Comment input */}
              <form
                onSubmit={onCommentSubmit}
                className="flex items-center w-full p-3 sm:p-4"
              >
                <Avatar className="size-8 mr-3 shrink-0">
                  <AvatarImage
                    src={currentUser?.imageUrl || 'https://i.pravatar.cc/150?u=kamu'}
                  />
                  <AvatarFallback>
                    {currentUser?.username?.[0]?.toUpperCase() || 'ME'}
                  </AvatarFallback>
                </Avatar>
                <Input
                  placeholder="Balas..."
                  value={commentInput}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className="border-none shadow-none bg-transparent focus-visible:ring-0 px-0 text-sm font-medium h-auto"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  disabled={!commentInput?.trim()}
                  className="text-primary font-black px-3"
                >
                  KIRIM
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
