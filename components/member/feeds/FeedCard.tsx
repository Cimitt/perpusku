'use client'

import {
  HeartIcon,
  MessageCircleIcon,
  SendIcon,
  BookmarkIcon,
  MoreHorizontalIcon,
  PencilIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatTimeAgo } from './feed.utils'
import type { FeedPost } from '@/types'

interface FeedCardProps {
  post: FeedPost
  commentInput: string
  onCommentChange: (value: string) => void
  onCommentSubmit: (e: React.FormEvent) => void
  onLike: () => void
  onOpenComments: () => void
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

export function FeedCard({
  post,
  commentInput,
  onCommentChange,
  onCommentSubmit,
  onLike,
  onOpenComments,
  canManage,
  onEdit,
  onDelete,
}: FeedCardProps) {
  return (
    <Card className="border-2 border-muted bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <CardHeader className="flex flex-row items-center p-3 sm:p-4 border-b-2 border-muted/50 space-y-0">
        <Avatar className="size-10 border-2 border-muted bg-muted/30 mr-3">
          <AvatarImage src={post.anggota?.avatar_url ?? undefined} />
          <AvatarFallback className="font-bold text-primary">
            {(post.anggota?.username || post.anggota?.nama_anggota || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {post.anggota?.username || post.anggota?.nama_anggota}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-secondary text-secondary font-black tracking-wider rounded-md"
            >
              {post.buku?.judul_buku || 'Post Umum'}
            </Badge>
          </div>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted" />
              }
            >
              <MoreHorizontalIcon className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 min-w-44">
              <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
                <PencilIcon className="size-4 text-slate-500" />
                Edit Feed
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" variant="destructive" onClick={onDelete}>
                <Trash2Icon className="size-4" />
                Hapus Feed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      {/* Media */}
      <div className="relative w-full aspect-[4/5] bg-muted/20 border-b-2 border-muted/50 overflow-hidden flex items-center justify-center">
        {post.media_type === 'image' ? (
          <img src={post.media_url ?? undefined} alt="Review Media" className="object-cover w-full h-full" />
        ) : (
          <video
            src={post.media_url ?? undefined}
            controls
            muted
            loop
            playsInline
            className="object-contain w-full h-full bg-black/5"
          />
        )}
      </div>

      {/* Actions & Content */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Action bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onLike} className="hover:scale-110 active:scale-90 transition-transform">
              <HeartIcon
                className={`size-7 ${post.is_liked ? 'fill-primary text-primary' : 'text-foreground'}`}
              />
            </button>
            <button
              onClick={onOpenComments}
              className="hover:scale-110 active:scale-90 transition-transform"
            >
              <MessageCircleIcon className="size-7 text-foreground" />
            </button>
            <button className="hover:scale-110 active:scale-90 transition-transform">
              <SendIcon className="size-6 text-foreground -mt-1" />
            </button>
          </div>
          <button className="hover:scale-110 active:scale-90 transition-transform">
            <BookmarkIcon className="size-6 text-foreground" />
          </button>
        </div>

        {/* Likes + Rating */}
        <div>
          <p className="text-sm font-black text-foreground">
            {post.likes_count?.toLocaleString()} suka
          </p>
          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                className={`size-3.5 ${
                  i < (post.rating || 5) ? 'fill-secondary text-secondary' : 'fill-muted text-muted'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-bold text-foreground mr-2">
            {post.anggota?.username || post.anggota?.nama_anggota?.split(' ')[0]}
          </span>
          <span className="font-medium text-slate-600 leading-relaxed">{post.caption}</span>
        </div>

        {/* Comments preview */}
        {post.feed_comments && post.feed_comments.length > 0 && (
          <div className="space-y-1">
            <p
              onClick={onOpenComments}
              className="text-xs font-bold text-muted-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
            >
              Lihat semua {post.feed_comments.length} komentar
            </p>
            {post.feed_comments.slice(0, 2).map((comment) => (
              <div key={comment.id_comment} className="text-sm flex gap-2">
                <span className="font-bold text-foreground shrink-0">
                  {comment.anggota?.username || 'Member'}
                </span>
                <span className="font-medium text-slate-600 line-clamp-1">
                  {comment.comment_text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
          {formatTimeAgo(post.created_at)}
        </p>
      </div>

      {/* Comment form footer */}
      <CardFooter className="p-0 border-t-2 border-muted bg-slate-50">
        <form onSubmit={onCommentSubmit} className="flex items-center w-full px-3 sm:px-4 py-2">
          <Input
            placeholder="Tambahkan komentar..."
            value={commentInput}
            onChange={(e) => onCommentChange(e.target.value)}
            className="border-none shadow-none bg-transparent focus-visible:ring-0 px-0 text-sm font-medium h-auto placeholder:text-muted-foreground/60"
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
      </CardFooter>
    </Card>
  )
}
