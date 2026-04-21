'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import type { FeedPost, FeedCommentWithAnggota } from '@/types'

export function useFeeds() {
  const { getToken } = useAuth()
  const { user } = useUser()

  // feed list state
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null)

  // comment modal state
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null)

  // create feed modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newCaption, setNewCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // file upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [manageMode, setManageMode] = useState<'edit' | 'delete' | null>(null)
  const [manageTarget, setManageTarget] = useState<FeedPost | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false)
  const [isDeletingFeed, setIsDeletingFeed] = useState(false)

  const canManagePost = useCallback(
    (post: FeedPost | null) => {
      if (!post || currentMemberId === null) return false
      return post.id_anggota === currentMemberId
    },
    [currentMemberId]
  )

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchFeeds = useCallback(async () => {
    try {
      const res = await fetch('/api/feeds')
      if (!res.ok) throw new Error('Gagal memuat feed')
      const data = await res.json()
      setPosts(data)
    } catch {
      toast.error('Gagal memuat feed komunitas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFeeds()
  }, [fetchFeeds])

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch('/api/member/me')
        if (!res.ok) throw new Error('Gagal memuat profil anggota')
        const data = await res.json()
        setCurrentMemberId(data.id_anggota ?? null)
      } catch {
        setCurrentMemberId(null)
      }
    }

    fetchMe()
  }, [])

  // ── Like ───────────────────────────────────────────────────────────────────

  const toggleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id_feed === postId) {
          const updated: FeedPost = {
            ...post,
            is_liked: !post.is_liked,
            likes_count: post.is_liked
              ? (post.likes_count ?? 1) - 1
              : (post.likes_count ?? 0) + 1,
          }
          if (selectedPost?.id_feed === postId) setSelectedPost(updated)
          return updated
        }
        return post
      })
    )

    try {
      const token = await getToken()
      await fetch(`/api/feeds/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch {
      console.error('Gagal mengirim like ke server')
    }
  }

  // ── Comment ────────────────────────────────────────────────────────────────

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault()
    const text = commentInputs[postId]
    if (!text?.trim()) return

    const newCommentDummy: FeedCommentWithAnggota = {
      id_comment: `temp-${Date.now()}`,
      comment_text: text,
      created_at: new Date().toISOString(),
      id_feed: postId,
      id_anggota: null,
      anggota: {
        username: user?.username || 'Kamu',
        avatar_url: user?.imageUrl || 'https://i.pravatar.cc/150?u=kamu',
      },
    }

    setPosts((prev) =>
      prev.map((post) => {
        if (post.id_feed === postId) {
          const updated: FeedPost = {
            ...post,
            feed_comments: [...post.feed_comments, newCommentDummy],
          }
          if (selectedPost?.id_feed === postId) setSelectedPost(updated)
          return updated
        }
        return post
      })
    )

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }))

    try {
      const token = await getToken()
      await fetch(`/api/feeds/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment_text: text }),
      })
    } catch {
      console.error('Gagal mengirim komentar ke server')
    }
  }

  // ── File Upload ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      toast.error('File harus berupa gambar atau video.')
      setSelectedFile(null)
      setPreviewUrl('')
      return
    }

    setSelectedFile(file)
    setMediaType(isImage ? 'image' : 'video')
    setPreviewUrl(URL.createObjectURL(file))
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  const resetForm = () => {
    setIsCreateOpen(false)
    setNewCaption('')
    setSelectedFile(null)
    setMediaType('image')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  // ── Create Feed ────────────────────────────────────────────────────────────

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCaption.trim() || !selectedFile) {
      toast.error('Caption dan media (gambar/video) wajib diisi.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('caption', newCaption)
      formData.append('media', selectedFile)

      const res = await fetch('/api/feeds', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Gagal mengirim ke server')

      toast.success('Review berhasil di-posting!')
      resetForm()
      fetchFeeds()
    } catch (e) {
      console.error(e)
      toast.error('Gagal menyimpan ke database. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (post: FeedPost) => {
    if (!canManagePost(post)) {
      toast.error('Kamu hanya bisa mengedit feed milikmu sendiri.')
      return
    }

    setManageTarget(post)
    setEditCaption(post.caption ?? '')
    setManageMode('edit')
  }

  const openDeleteDialog = (post: FeedPost) => {
    if (!canManagePost(post)) {
      toast.error('Kamu hanya bisa menghapus feed milikmu sendiri.')
      return
    }

    setManageTarget(post)
    setManageMode('delete')
  }

  const closeManageDialog = () => {
    if (isUpdatingFeed || isDeletingFeed) return
    setManageMode(null)
    setManageTarget(null)
    setEditCaption('')
  }

  const handleEditFeed = async () => {
    if (!manageTarget || !editCaption.trim()) return
    if (!canManagePost(manageTarget)) {
      toast.error('Kamu hanya bisa mengedit feed milikmu sendiri.')
      closeManageDialog()
      return
    }

    setIsUpdatingFeed(true)

    try {
      const res = await fetch(`/api/feeds/${manageTarget.id_feed}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption: editCaption.trim() }),
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Gagal memperbarui feed')
      }

      setPosts((prev) =>
        prev.map((post) =>
          post.id_feed === manageTarget.id_feed
            ? { ...post, caption: editCaption.trim() }
            : post
        )
      )

      if (selectedPost?.id_feed === manageTarget.id_feed) {
        setSelectedPost((prev) => (prev ? { ...prev, caption: editCaption.trim() } : prev))
      }

      toast.success('Feed berhasil diperbarui.')
      setManageMode(null)
      setManageTarget(null)
      setEditCaption('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui feed.')
    } finally {
      setIsUpdatingFeed(false)
    }
  }

  const handleDeleteFeed = async () => {
    if (!manageTarget) return
    if (!canManagePost(manageTarget)) {
      toast.error('Kamu hanya bisa menghapus feed milikmu sendiri.')
      closeManageDialog()
      return
    }

    setIsDeletingFeed(true)

    try {
      const res = await fetch(`/api/feeds/${manageTarget.id_feed}`, {
        method: 'DELETE',
      })

      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error || 'Gagal menghapus feed')
      }

      setPosts((prev) => prev.filter((post) => post.id_feed !== manageTarget.id_feed))
      setCommentInputs((prev) => {
        const next = { ...prev }
        delete next[manageTarget.id_feed]
        return next
      })

      if (selectedPost?.id_feed === manageTarget.id_feed) {
        setSelectedPost(null)
      }

      toast.success('Feed berhasil dihapus.')
      setManageMode(null)
      setManageTarget(null)
      setEditCaption('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus feed.')
    } finally {
      setIsDeletingFeed(false)
    }
  }

  return {
    // data
    posts,
    loading,
    currentMemberId,
    // comment input state
    commentInputs,
    setCommentInputs,
    // comment modal
    selectedPost,
    setSelectedPost,
    // create modal
    isCreateOpen,
    setIsCreateOpen,
    newCaption,
    setNewCaption,
    isSubmitting,
    // file upload
    selectedFile,
    previewUrl,
    mediaType,
    fileInputRef,
    manageMode,
    manageTarget,
    editCaption,
    isUpdatingFeed,
    isDeletingFeed,
    setEditCaption,
    // actions
    actions: {
      fetchFeeds,
      toggleLike,
      handleAddComment,
      handleFileChange,
      clearFile,
      resetForm,
      handleCreateFeed,
      openEditDialog,
      openDeleteDialog,
      closeManageDialog,
      handleEditFeed,
      handleDeleteFeed,
    },
    // current user (needed by modals)
    user,
  }
}
