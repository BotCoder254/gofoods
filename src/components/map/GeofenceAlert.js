import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Bell, CheckCircle } from 'lucide-react'
import { calculateDistance } from '../../utils/distance'
import { toast } from 'react-toastify'

const GeofenceAlert = ({ userLocation, targetLocation, radius = 0.5, onEnter, isActive }) => {
  const [isInside, setIsInside] = useState(false)
  const [hasNotified, setHasNotified] = useState(false)

  useEffect(() => {
    if (!userLocation || !targetLocation || !isActive) return

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      targetLocation.lat,
      targetLocation.lng
    )

    const wasInside = isInside
    const nowInside = distance <= radius

    setIsInside(nowInside)

    if (nowInside && !wasInside && !hasNotified) {
      setHasNotified(true)
      toast.success('You are nearby! The other party has been notified.', {
        icon: '📍'
      })
      if (onEnter) onEnter()
    }

    if (!nowInside && wasInside) {
      setHasNotified(false)
    }
  }, [userLocation, targetLocation, radius, isActive, isInside, hasNotified, onEnter])

  if (!isActive || !userLocation || !targetLocation) return null

  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  )

  return (
    <AnimatePresence>
      {distance <= radius * 2 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`rounded-xl p-4 shadow-lg ${
            isInside 
              ? 'bg-gradient-to-r from-accent to-accent/80 text-white' 
              : 'bg-gradient-to-r from-warning to-warning/80 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              {isInside ? <CheckCircle size={24} /> : <Bell size={24} />}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm md:text-base">
                {isInside ? 'You have arrived!' : 'Getting close'}
              </div>
              <div className="text-xs md:text-sm opacity-90">
                {distance.toFixed(2)} km away • {isInside ? 'Within pickup zone' : 'Almost there'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(distance * 1000)}m</div>
              <div className="text-xs opacity-90">distance</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default GeofenceAlert
