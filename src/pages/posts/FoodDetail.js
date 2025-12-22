import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Heart, Share2, MapPin, DollarSign, Package, 
  Clock, Truck, Home, User, MessageCircle, ChevronLeft, 
  ChevronRight, X, Tag, Send
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFoodItemById, getFoodImageUrl } from '../../lib/foodItems'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../../components/common/FormElements'
import Loader from '../../components/common/Loader'
import { formatDistance, calculateDistance } from '../../utils/distance'
import { formatDate } from '../../utils/helpers'
import RequestModal from '../../components/requests/RequestModal'
import BookmarkButton from '../../components/bookmarks/BookmarkButton'

const FoodDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const { data: item, isLoading } = useQuery({
    queryKey: ['foodItem', id],
    queryFn: () => getFoodItemById(id)
  })

  const { data: owner } = useQuery({
    queryKey: ['user', item?.ownerId],
    queryFn: () => getUserById(item.ownerId),
    enabled: !!item?.ownerId
  })

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
                    Member since {formatDate(owner.createdAt)}
                  </div>
                </div>
                <Link to={`/profile/${owner.$id}`}>
                  <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <User size={20} />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Location */}
          {item.pickupAddress && (
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <MapPin size={20} className="text-primary" />
                Location
              </h3>
              <p className="text-neutral-700">{item.pickupAddress.placeName}</p>
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
    </div>
  )
}

export default FoodDetail
