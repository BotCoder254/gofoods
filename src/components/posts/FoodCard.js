import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MapPin, DollarSign, Truck, Home, Clock } from 'lucide-react'
import { getFoodImageUrl } from '../../lib/foodItems'
import { calculateDistance, formatDistance, getTimeRemaining } from '../../utils/distance'
import { useAuth } from '../../context/AuthContext'
import BookmarkButton from '../bookmarks/BookmarkButton'

const FoodCard = ({ item, index }) => {
  const { user } = useAuth()
  
  const distance = user?.location && item.pickupAddress
    ? calculateDistance(
        user.location.lat,
        user.location.lng,
        item.pickupAddress.lat,
        item.pickupAddress.lng
      )
    : null

  const timeLeft = getTimeRemaining(item.availableUntil)
  const coverImage = item.images?.[0] 
    ? getFoodImageUrl(item.images[0], 400, 400)
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/food/${item.$id}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all group">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
            <img
              src={coverImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {item.isDonation && (
                <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full">
                  FREE
                </span>
              )}
              {timeLeft && (
                <span className="px-3 py-1 bg-warning text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Clock size={12} />
                  {timeLeft}
                </span>
              )}
            </div>

            {/* Bookmark */}
            <div className="absolute top-3 right-3">
              <BookmarkButton foodItemId={item.$id} size={18} className="bg-white/90 backdrop-blur-sm hover:bg-white" />
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {item.title}
            </h3>

            {item.description && (
              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                {distance !== null && (
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <MapPin size={16} className="text-primary" />
                    <span>{formatDistance(distance)}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  {item.pickup && (
                    <div className="p-1.5 bg-primary/10 rounded-lg" title="Pickup available">
                      <Home size={14} className="text-primary" />
                    </div>
                  )}
                  {item.delivery && (
                    <div className="p-1.5 bg-secondary/10 rounded-lg" title="Delivery available">
                      <Truck size={14} className="text-secondary" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 font-bold text-lg text-primary">
                {item.isDonation ? (
                  <span className="text-accent">Free</span>
                ) : (
                  <>
                    <DollarSign size={18} />
                    <span>{item.price?.toFixed(2) || '0.00'}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default FoodCard
