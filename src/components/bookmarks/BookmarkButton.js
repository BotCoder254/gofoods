import React from 'react'
import { Bookmark } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createBookmark, deleteBookmark, checkBookmark } from '../../lib/bookmarks'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'

const BookmarkButton = ({ foodItemId, size = 24, className = '' }) => {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const { data: bookmark } = useQuery({
    queryKey: ['bookmark', session.$id, foodItemId],
    queryFn: () => checkBookmark(session.$id, foodItemId),
    enabled: !!session.$id && !!foodItemId
  })

  const isBookmarked = !!bookmark

  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await deleteBookmark(bookmark.$id)
      } else {
        await createBookmark(session.$id, foodItemId)
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries(['bookmark', session.$id, foodItemId])
      const previousBookmark = queryClient.getQueryData(['bookmark', session.$id, foodItemId])
      
      queryClient.setQueryData(['bookmark', session.$id, foodItemId], (old) => {
        return isBookmarked ? null : { $id: 'temp', userId: session.$id, foodItemId }
      })
      
      return { previousBookmark }
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['bookmark', session.$id, foodItemId], context.previousBookmark)
      toast.error('Failed to update bookmark')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookmark', session.$id, foodItemId])
      queryClient.invalidateQueries(['bookmarks', session.$id])
      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks')
    }
  })

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleBookmarkMutation.mutate()
      }}
      className={`p-2 hover:bg-neutral-100 rounded-lg transition-colors ${className}`}
    >
      <Bookmark
        size={size}
        className={`transition-colors ${
          isBookmarked ? 'fill-primary text-primary' : 'text-neutral-700'
        }`}
      />
    </motion.button>
  )
}

export default BookmarkButton
