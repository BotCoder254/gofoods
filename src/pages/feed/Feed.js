import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, Filter, SlidersHorizontal, X, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { getFoodItems } from '../../lib/foodItems'
import { calculateDistance } from '../../utils/distance'
import FoodCard from '../../components/posts/FoodCard'
import Loader from '../../components/common/Loader'
import { Link } from 'react-router-dom'

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
  const { searchQuery = '' } = useOutletContext() || {}
  const [activeFilter, setActiveFilter] = useState('all')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    pickup: null,
    delivery: null,
    availableNow: false
  })

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
  const searchedItems = searchQuery
    ? items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items

  // Apply advanced filters
  const advancedFilteredItems = searchedItems.filter(item => {
    if (advancedFilters.pickup !== null && item.pickup !== advancedFilters.pickup) return false
    if (advancedFilters.delivery !== null && item.delivery !== advancedFilters.delivery) return false
    if (advancedFilters.availableNow) {
      const now = new Date()
      if (item.availableFrom && new Date(item.availableFrom) > now) return false
      if (item.availableUntil && new Date(item.availableUntil) < now) return false
    }
    return true
  })

  // Sort by distance if nearby filter
  const sortedItems = activeFilter === 'nearby' && user?.location
    ? [...advancedFilteredItems].sort((a, b) => {
        if (!a.pickupAddress || !b.pickupAddress) return 0
        const distA = calculateDistance(
          user.location.lat,
          user.location.lng,
          a.pickupAddress.lat,
          a.pickupAddress.lng
        )
        const distB = calculateDistance(
          user.location.lat,
          user.location.lng,
          b.pickupAddress.lat,
          b.pickupAddress.lng
        )
        return distA - distB
      })
    : advancedFilteredItems

  return (
    <div className="max-w-7xl mx-auto">
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
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
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
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal size={20} />
          <span className="hidden sm:inline">Filters</span>
        </button>
        
        <Link
          to="/map"
          className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <MapPin size={20} />
          <span className="hidden sm:inline">Map</span>
        </Link>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-900">Advanced Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedFilters.pickup === true}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, pickup: e.target.checked ? true : null })}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">Pickup Available</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedFilters.delivery === true}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, delivery: e.target.checked ? true : null })}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">Delivery Available</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedFilters.availableNow}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, availableNow: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">Available Now</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
