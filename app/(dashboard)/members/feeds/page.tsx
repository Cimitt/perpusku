'use client'

import { ImagePlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFeeds } from '@/hooks/useFeeds'
import {
  FeedCard,
  FeedCommentModal,
  FeedCreateModal,
  FeedLoading,
  FeedEmpty,
} from '@/components/member/feeds'

export default function ReviewFeedPage() {
  const {
    posts,
    loading,
    commentInputs,
    setCommentInputs,
    selectedPost,
    setSelectedPost,
    isCreateOpen,
    setIsCreateOpen,
    newCaption,
    setNewCaption,
    isSubmitting,
    selectedFile,
    previewUrl,
    mediaType,
    fileInputRef,
    actions,
    user,
  } = useFeeds()

  if (loading) return <FeedLoading />

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">

      {/* Page header */}
      <div className="flex items-center justify-between px-2 pt-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Community Reviews</h1>
          <p className="text-sm font-medium text-muted-foreground">Apa kata mereka tentang buku ini?</p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="font-bold border-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-xl gap-2 shadow-none"
        >
          <ImagePlusIcon className="size-4" /> BUAT REVIEW
        </Button>
      </div>

      {/* Feed list */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <FeedEmpty />
        ) : (
          posts.map((post) => (
            <FeedCard
              key={post.id_feed}
              post={post}
              commentInput={commentInputs[post.id_feed] || ''}
              onCommentChange={(val) =>
                setCommentInputs((prev) => ({ ...prev, [post.id_feed]: val }))
              }
              onCommentSubmit={(e) => actions.handleAddComment(post.id_feed, e)}
              onLike={() => actions.toggleLike(post.id_feed)}
              onOpenComments={() => setSelectedPost(post)}
            />
          ))
        )}
      </div>

      {/* Comment modal */}
      <FeedCommentModal
        post={selectedPost}
        commentInput={commentInputs[selectedPost?.id_feed ?? ''] || ''}
        currentUser={user ? { imageUrl: user.imageUrl, username: user.username ?? undefined } : null}
        onClose={() => setSelectedPost(null)}
        onCommentChange={(val) =>
          selectedPost &&
          setCommentInputs((prev) => ({ ...prev, [selectedPost.id_feed]: val }))
        }
        onCommentSubmit={(e) =>
          selectedPost && actions.handleAddComment(selectedPost.id_feed, e)
        }
        onLike={() => selectedPost && actions.toggleLike(selectedPost.id_feed)}
      />

      {/* Create feed modal */}
      <FeedCreateModal
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        newCaption={newCaption}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        mediaType={mediaType}
        fileInputRef={fileInputRef}
        onClose={actions.resetForm}
        onCaptionChange={setNewCaption}
        onFileChange={actions.handleFileChange}
        onClearFile={actions.clearFile}
        onSubmit={actions.handleCreateFeed}
      />

    </div>
  )
}