import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecipeComment, getRecipeComments, deleteRecipeComment } from '../../lib/recipeComments'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { formatDistanceToNow } from 'date-fns'

const RecipeComments = ({ recipeId }) => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [comment, setComment] = useState('')

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['recipeComments', recipeId],
    queryFn: () => getRecipeComments(recipeId)
  })

  const createMutation = useMutation({
    mutationFn: (data) => createRecipeComment(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipeComments', recipeId])
      setComment('')
      toast.success('Comment added!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add comment')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteRecipeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipeComments', recipeId])
      toast.success('Comment deleted')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete comment')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return

    createMutation.mutate({
      recipeId,
      userId: user.$id,
      content: comment.trim()
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <MessageCircle size={24} className="text-primary" />
        Comments & Tips ({comments.length})
      </h2>

      {user?.isVerified && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <img
              src={user.avatarFileId ? getAvatarUrl(user.avatarFileId) : `https://ui-avatars.com/api/?name=${user.displayName}&background=FF5136&color=fff`}
              alt={user.displayName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share a tip or comment..."
                className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={!comment.trim() || createMutation.isPending}
                className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </form>
      )}

      {!user?.isVerified && (
        <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-center text-sm text-neutral-600">
          Please verify your email to leave comments
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <CommentItem
              key={comment.$id}
              comment={comment}
              currentUserId={user?.$id}
              onDelete={() => deleteMutation.mutate(comment.$id)}
              index={index}
            />
          ))}
        </AnimatePresence>

        {!isLoading && comments.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  )
}

const CommentItem = ({ comment, currentUserId, onDelete, index }) => {
  const { data: author } = useQuery({
    queryKey: ['user', comment.userId],
    queryFn: () => getUserById(comment.userId)
  })

  if (!author) return null

  const isOwner = currentUserId === comment.userId
  const timeAgo = comment.$createdAt ? formatDistanceToNow(new Date(comment.$createdAt), { addSuffix: true }) : ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-4 rounded-xl hover:bg-neutral-50 transition-colors"
    >
      <img
        src={author.avatarFileId ? getAvatarUrl(author.avatarFileId) : `https://ui-avatars.com/api/?name=${author.displayName}&background=FF5136&color=fff`}
        alt={author.displayName}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-neutral-900">{author.displayName}</span>
          <span className="text-xs text-neutral-500">{timeAgo}</span>
        </div>
        <p className="text-neutral-700">{comment.content}</p>
      </div>
      {isOwner && (
        <button
          onClick={onDelete}
          className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      )}
    </motion.div>
  )
}

export default RecipeComments
