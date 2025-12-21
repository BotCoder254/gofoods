import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { getBookmarksByUser } from '../../lib/bookmarks'
import { getFoodItemById } from '../../lib/foodItems'
import { useAuth } from '../../context/AuthContext'
import { Bookmark } from 'lucide-react'
import Loader from '../../components/common/Loader'
import FoodCard from '../../components/posts/FoodCard'

const Bookmarks = () => {
  const { session } = useAuth()

  const { data: bookmarks, isLoading } = useQuery({
    queryKey: ['bookmarks', session.$id],
    queryFn: () => getBookmarksByUser(session.$id),
    enabled: !!session.$id
  })

  const bookmarksList = bookmarks?.documents || []

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Bookmarks
        </h1>
        <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Your saved food items
        </p>
      </motion.div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {!isLoading && bookmarksList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookmarksList.map((bookmark, index) => (
            <BookmarkedFoodCard key={bookmark.$id} foodItemId={bookmark.foodItemId} index={index} />
          ))}
        </div>
      )}

      {!isLoading && bookmarksList.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            No Bookmarks Yet
          </h3>
          <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Start bookmarking food items you like!
          </p>
        </motion.div>
      )}
    </div>
  )
}

const BookmarkedFoodCard = ({ foodItemId, index }) => {
  const { data: item, isLoading } = useQuery({
    queryKey: ['foodItem', foodItemId],
    queryFn: () => getFoodItemById(foodItemId)
  })

  if (isLoading) return <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
  if (!item) return null

  return <FoodCard item={item} index={index} />
}

export default Bookmarks
