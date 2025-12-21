import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Utensils, Filter, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getFoodItems } from '../../lib/foodItems'
import EmailVerificationBanner from '../../components/common/EmailVerificationBanner'
import FoodCard from '../../components/posts/FoodCard'
import Loader from '../../components/common/Loader'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'nearby', label: 'Nearby' },
  { value: 'donation', label: 'Free' },
  { value: 'meal', label: 'Meals' },
  { value: 'baked', label: 'Baked' },
  { value: 'produce', label: 'Produce' }
]

const Feed = () => {
  const { user, refetchUser } = useAuth()
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: foodItems, isLoading } = useQuery({
    queryKey: ['foodItems', activeFilter],
    queryFn: () => {
      const filters = {}
      if (activeFilter === 'donation') {
        filters.isDonation = true
      } else if (activeFilter !== 'all' && activeFilter !== 'nearby') {
        filters.foodType = activeFilter
      }
      return getFoodItems(filters)
    }
  })

  const items = foodItems?.documents || []

  // Filter by search term
  const searchedItems = searchTerm
    ? items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : items

  // Sort by distance if nearby filter
  const sortedItems = activeFilter === 'nearby' && user?.location
    ? [...searchedItems].sort((a, b) => {
        if (!a.pickupAddress || !b.pickupAddress) return 0
        const distA = Math.hypot(
          a.pickupAddress.lat - user.location.lat,
          a.pickupAddress.lng - user.location.lng
        )
        const distB = Math.hypot(
          b.pickupAddress.lat - user.location.lat,
          b.pickupAddress.lng - user.location.lng
        )
        return distA - distB
      })
    : searchedItems

  return (
    <div className="max-w-7xl mx-auto">
      {/* Email Verification Banner */}
      <EmailVerificationBanner user={user} onVerified={refetchUser} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Food Feed
        </h1>
        <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Discover local food shared by your community
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {FILTERS.map((filter, index) => (
          <motion.button
            key={filter.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {/* Food Grid */}
      {!isLoading && sortedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item, index) => (
            <FoodCard key={item.$id} item={item} index={index} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            No Posts Yet
          </h3>
          <p className="text-neutral-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Be the first to share food in your community!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default Feed
