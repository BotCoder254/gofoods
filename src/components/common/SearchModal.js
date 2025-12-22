import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MapPin, DollarSign, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { searchFoodItems, getFoodImageUrl } from '../../lib/foodItems'
import { searchUsers, getAvatarUrl } from '../../lib/users'
import Loader from '../common/Loader'

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('food')
  const navigate = useNavigate()

  const { data: foodResults = [], isLoading: loadingFood } = useQuery({
    queryKey: ['search', 'food', searchQuery],
    queryFn: () => searchFoodItems(searchQuery),
    enabled: searchQuery.length > 0 && activeTab === 'food'
  })

  const { data: userResults = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['search', 'users', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length > 0 && activeTab === 'users'
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleFoodClick = (foodId) => {
    navigate(`/food/${foodId}`)
    onClose()
  }

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`)
    onClose()
  }

  const isLoading = activeTab === 'food' ? loadingFood : loadingUsers
  const results = activeTab === 'food' ? foodResults : userResults

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-4 left-4 right-4 md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-neutral-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for food or users..."
                    autoFocus
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none transition-all"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('food')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'food'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Food Items
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'users'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 md:max-h-[500px] overflow-y-auto">
              {!searchQuery && (
                <div className="p-12 text-center text-neutral-500">
                  <Search size={48} className="mx-auto mb-4 text-neutral-300" />
                  <p>Start typing to search...</p>
                </div>
              )}

              {searchQuery && isLoading && (
                <div className="p-12 flex justify-center">
                  <Loader size="lg" />
                </div>
              )}

              {searchQuery && !isLoading && results.length === 0 && (
                <div className="p-12 text-center text-neutral-500">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              )}

              {searchQuery && !isLoading && results.length > 0 && (
                <div className="divide-y divide-neutral-200">
                  {activeTab === 'food' && foodResults.map((item) => (
                    <motion.div
                      key={item.$id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleFoodClick(item.$id)}
                      className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <div className="flex gap-4">
                        <img
                          src={item.images?.[0] ? getFoodImageUrl(item.images[0], 100, 100) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                          alt={item.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutral-900 truncate">{item.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-600">
                            {item.isDonation ? (
                              <span className="text-accent font-bold">Free</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <DollarSign size={14} />
                                <span>{item.price?.toFixed(2)}</span>
                              </div>
                            )}
                            {item.pickupAddress?.placeName && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin size={14} />
                                <span className="truncate">{item.pickupAddress.placeName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {activeTab === 'users' && userResults.map((user) => (
                    <motion.div
                      key={user.$id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleUserClick(user.$id)}
                      className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={user.avatarFileId ? getAvatarUrl(user.avatarFileId) : `https://ui-avatars.com/api/?name=${user.displayName}&background=FF5136&color=fff`}
                          alt={user.displayName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-neutral-900 truncate">{user.displayName}</h3>
                          <p className="text-sm text-neutral-600 truncate">{user.email}</p>
                        </div>
                        <User size={20} className="text-neutral-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default SearchModal
