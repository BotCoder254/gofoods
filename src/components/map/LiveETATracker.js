import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Navigation, TrendingDown, TrendingUp } from 'lucide-react'
import { calculateDistance } from '../../utils/distance'

const LiveETATracker = ({ currentLocation, destination, isActive }) => {
  const [eta, setEta] = useState(null)
  const [previousEta, setPreviousEta] = useState(null)

  useEffect(() => {
    if (!currentLocation || !destination || !isActive) return

    const calculateETA = async () => {
      try {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          destination.lat,
          destination.lng
        )
        
        const avgSpeed = 40 // km/h average speed
        const estimatedMinutes = Math.round((distance / avgSpeed) * 60)
        
        setPreviousEta(eta)
        setEta(estimatedMinutes)
      } catch (error) {
        console.error('Error calculating ETA:', error)
      }
    }

    calculateETA()
    const interval = setInterval(calculateETA, 15000) // Update every 15 seconds

    return () => clearInterval(interval)
  }, [currentLocation, destination, isActive])

  if (!eta || !isActive) return null

  const etaChange = previousEta ? eta - previousEta : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-xs opacity-90">Estimated Arrival</div>
            <div className="text-2xl font-bold">{eta} min</div>
          </div>
        </div>
        
        {etaChange !== 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 text-sm"
          >
            {etaChange < 0 ? (
              <>
                <TrendingDown size={16} />
                <span>{Math.abs(etaChange)} min faster</span>
              </>
            ) : (
              <>
                <TrendingUp size={16} />
                <span>{etaChange} min slower</span>
              </>
            )}
          </motion.div>
        )}
      </div>
      
      <div className="mt-3 flex items-center gap-2 text-xs opacity-90">
        <Navigation size={14} />
        <span>Updates every 15 seconds</span>
      </div>
    </motion.div>
  )
}

export default LiveETATracker
