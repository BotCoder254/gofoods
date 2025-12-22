import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Heart, Share2, MapPin, DollarSign, Package, 
  Clock, Truck, Home, User, MessageCircle, ChevronLeft, 
  ChevronRight, X, Tag, Send, MoreVertical, Edit, Trash2, AlertTriangle,
  Info, Navigation2
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getFoodItemById, getFoodImageUrl, deleteFoodItem, updateFoodItem } from '../../lib/foodItems'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { getRequestsByFoodItem } from '../../lib/requests'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/FormElements'
import Loader from '../../components/common/Loader'
import { formatDistance, calculateDistance } from '../../utils/distance'
import { formatDate } from '../../utils/helpers'
import RequestModal from '../../components/requests/RequestModal'
import CreatePostModal from '../../components/posts/CreatePostModal'
import BookmarkButton from '../../components/bookmarks/BookmarkButton'
import LocationRouteTab from '../../components/map/LocationRouteTab'
import { toast } from 'react-toastify'

const FoodDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const { data: item, isLoading } = useQuery({
    queryKey: ['foodItem', id],
    queryFn: () => getFoodItemById(id)
  })

  const { data: owner } = useQuery({
    queryKey: ['user', item?.ownerId],
    queryFn: () => getUserById(item.ownerId),
    enabled: !!item?.ownerId
  })

  const { data: similarItems } = useQuery({
    queryKey: ['similarItems', item?.foodType, item?.tags],
    queryFn: async () => {
      const { getFoodItems } = await import('../../lib/foodItems')
      const response = await getFoodItems({ foodType: item.foodType })
      return response.documents
        .filter(i => i.$id !== item.$id)
        .slice(0, 4)
    },
    enabled: !!item?.foodType
  })

  const { data: activeRequests } = useQuery({
    queryKey: ['foodRequests', id],
    queryFn: () => getRequestsByFoodItem(id),
    enabled: !!id && user?.$id === item?.ownerId
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteFoodItem(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['foodItems'])
      toast.success('Food item deleted successfully')
      navigate('/feed')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete item')
    }
  })

  const handleDelete = () => {
    const acceptedRequests = activeRequests?.documents?.filter(r => r.status === 'accepted') || []
    
    if (acceptedRequests.length > 0) {
      toast.error('Cannot delete item with accepted requests. Please complete or cancel them first.')
      setShowDeleteModal(false)
      return
    }
    
    deleteMutation.mutate()
  }

  const handleEdit = () => {
    const editCount = item.editCount || 0
    if (editCount >= 3) {
      toast.error('Maximum edit limit (3) reached for this item')
      return
    }
    setShowOptionsMenu(false)
    setShowEditModal(true)
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Item not found</h2>
        <Button onClick={() => navigate('/feed')}>Back to Feed</Button>
      </div>
    )
  }

  const images = item.images?.map(id => getFoodImageUrl(id, 800, 800)) || [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop'
  ]

  const distance = user?.location && item.pickupAddress
    ? calculateDistance(
        user.location.lat,
        user.location.lng,
        item.pickupAddress.lat,
        item.pickupAddress.lng
      )
    : null

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/feed')}
        className="flex items-center gap-2 text-neutral-600 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Feed</span>
      </motion.button>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
      >
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === 'details'
              ? 'bg-primary text-white shadow-lg'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <Info size={18} />
          <span>Details</span>
        </button>
        {item.pickupAddress && item.pickupAddress.lat && item.pickupAddress.lng && (
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === 'location'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Navigation2 size={18} />
            <span>Location & Route</span>
          </button>
        )}
      </motion.div>

      {/* Details Tab */}
      {activeTab === 'details' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Main Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 group">
            <img
              src={images[currentImageIndex]}
              alt={item.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowImageModal(true)}
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-primary'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column - Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <h1 className="text-3xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {item.title}
              </h1>
              <div className="flex gap-2">
                <BookmarkButton foodItemId={item.$id} size={24} />
                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                  <Share2 size={24} className="text-neutral-700" />
                </button>
                {user?.$id === item.ownerId && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={24} className="text-neutral-700" />
                    </button>
                    
                    <AnimatePresence>
                      {showOptionsMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-10"
                        >
                          <button
                            onClick={handleEdit}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
                          >
                            <Edit size={18} className="text-neutral-700" />
                            <span className="text-neutral-900">Edit</span>
                            {item.editCount >= 3 && (
                              <span className="ml-auto text-xs text-error">Limit reached</span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowOptionsMenu(false)
                              setShowDeleteModal(true)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error/10 transition-colors text-left border-t border-neutral-200"
                          >
                            <Trash2 size={18} className="text-error" />
                            <span className="text-error">Delete</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-2 mb-4">
              {item.isDonation ? (
                <span className="text-3xl font-bold text-accent">Free</span>
              ) : (
                <div className="flex items-center gap-1 text-3xl font-bold text-primary">
                  <DollarSign size={28} />
                  <span>{item.price?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              {item.isDonation && (
                <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-bold rounded-full">
                  DONATION
                </span>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm rounded-full flex items-center gap-1">
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package size={20} className="text-primary" />
              </div>
              <div>
                <div className="text-sm text-neutral-600">Quantity</div>
                <div className="font-bold text-neutral-900">{item.quantity} servings</div>
              </div>
            </div>

            {distance !== null && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <MapPin size={20} className="text-secondary" />
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Distance</div>
                  <div className="font-bold text-neutral-900">{formatDistance(distance)}</div>
                </div>
              </div>
            )}

            {item.pickup && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Home size={20} className="text-accent" />
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Pickup</div>
                  <div className="font-bold text-neutral-900">Available</div>
                </div>
              </div>
            )}

            {item.delivery && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Truck size={20} className="text-warning" />
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Delivery</div>
                  <div className="font-bold text-neutral-900">{item.deliveryRadiusKm}km radius</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Description
              </h3>
              <p className="text-neutral-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Owner Info */}
          {owner && (
            <div className="p-4 bg-white border border-neutral-200 rounded-xl">
              <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Seller Information
              </h3>
              <div className="flex items-center gap-3">
                <img
                  src={owner.avatarFileId ? getAvatarUrl(owner.avatarFileId) : `https://ui-avatars.com/api/?name=${owner.displayName}&background=FF5136&color=fff`}
                  alt={owner.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-bold text-neutral-900">{owner.displayName}</div>
                  <div className="text-sm text-neutral-600">
                    Member since {formatDate(owner.$createdAt)}
                  </div>
                </div>
                {user?.$id === owner.$id ? (
                  <Link to="/profile">
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                      <User size={20} />
                    </button>
                  </Link>
                ) : (
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Contact seller"
                  >
                    <MessageCircle size={20} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {item.pickupAddress && item.pickupAddress.placeName && (
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <MapPin size={20} className="text-primary" />
                Location
              </h3>
              <button
                onClick={() => {
                  if (item.pickupAddress?.lat && item.pickupAddress?.lng) {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.pickupAddress.lat},${item.pickupAddress.lng}`
                    window.open(url, '_blank')
                  }
                }}
                className="text-primary hover:text-primary/80 underline text-left transition-colors"
              >
                {item.pickupAddress.placeName}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {user?.$id !== item.ownerId ? (
              <>
                <Button 
                  variant="primary" 
                  fullWidth 
                  icon={Send}
                  onClick={() => setShowRequestModal(true)}
                >
                  Request Item
                </Button>
                <Button 
                  variant="outline" 
                  icon={MessageCircle}
                  onClick={() => setShowRequestModal(true)}
                >
                  Message
                </Button>
              </>
            ) : (
              <div className="w-full p-4 bg-neutral-100 rounded-xl text-center text-neutral-600">
                This is your listing
              </div>
            )}
          </div>

          {/* Posted Time */}
          <div className="text-sm text-neutral-500 text-center pt-4 border-t border-neutral-200">
            Posted {formatDate(item.createdAt)}
          </div>
        </motion.div>
      </div>
      )}

      {/* Location & Route Tab */}
      {activeTab === 'location' && item.pickupAddress && item.pickupAddress.lat && item.pickupAddress.lng && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <LocationRouteTab 
            foodItem={item} 
            enableTracking={user?.$id !== item.ownerId && activeRequests?.documents?.some(r => r.status === 'accepted')}
          />
        </motion.div>
      )}

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full"
            >
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
              
              <img
                src={images[currentImageIndex]}
                alt={item.title}
                className="w-full h-auto rounded-xl"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Modal */}
      {item && (
        <RequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          foodItem={item}
        />
      )}

      {/* Edit Modal */}
      {item && (
        <CreatePostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          editItem={item}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-error/10 rounded-full">
                  <AlertTriangle size={24} className="text-error" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Delete Food Item?
                </h3>
              </div>
              
              <p className="text-neutral-700 mb-6">
                Are you sure you want to delete this item? This action cannot be undone.
                {activeRequests?.documents?.some(r => r.status === 'accepted') && (
                  <span className="block mt-2 text-error font-medium">
                    ⚠️ You have accepted requests for this item. Please complete or cancel them first.
                  </span>
                )}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                  className="bg-error hover:bg-error/90"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Similar Items Section */}
      {similarItems && similarItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Similar Items
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarItems.map((similarItem, index) => (
              <motion.div
                key={similarItem.$id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/food/${similarItem.$id}`)}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={similarItem.images?.[0] ? getFoodImageUrl(similarItem.images[0], 400, 400) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'}
                    alt={similarItem.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {similarItem.isDonation && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                      FREE
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-neutral-900 mb-2 line-clamp-1">
                    {similarItem.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    {similarItem.isDonation ? (
                      <span className="text-lg font-bold text-accent">Free</span>
                    ) : (
                      <div className="flex items-center gap-1 text-lg font-bold text-primary">
                        <DollarSign size={18} />
                        <span>{similarItem.price?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <Package size={14} />
                      <span>{similarItem.quantity}</span>
                    </div>
                  </div>
                  {similarItem.tags && similarItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {similarItem.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default FoodDetail
