import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navigation, TrendingUp, Clock, MapPin, AlertCircle } from 'lucide-react'
import { Button } from '../common/FormElements'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

const RouteAwareAvailability = ({ currentLocation, pickupLocation, onAccept, onDecline }) => {
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentLocation || !pickupLocation) return

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation.lng},${currentLocation.lat};${pickupLocation.lng},${pickupLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        )
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          setRouteInfo({
            distance: (route.distance / 1000).toFixed(1),
            duration: Math.round(route.duration / 60),
            geometry: route.geometry
          })
        }
      } catch (error) {
        console.error('Error fetching route:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoute()
  }, [currentLocation, pickupLocation])

  if (loading) {
    return (
      <div className="bg-neutral-50 rounded-xl p-6 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-neutral-600 mt-3">Calculating route...</p>
      </div>
    )
  }

  if (!routeInfo) return null

  const isConvenient = parseFloat(routeInfo.distance) < 5 && routeInfo.duration < 15

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 md:p-6 border-2 ${
        isConvenient 
          ? 'bg-accent/5 border-accent' 
          : 'bg-warning/5 border-warning'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg ${
          isConvenient ? 'bg-accent/20' : 'bg-warning/20'
        }`}>
          {isConvenient ? (
            <Navigation size={24} className="text-accent" />
          ) : (
            <AlertCircle size={24} className="text-warning" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base md:text-lg text-neutral-900 mb-1">
            {isConvenient ? 'Convenient Route' : 'Consider This Route'}
          </h3>
          <p className="text-xs md:text-sm text-neutral-600">
            {isConvenient 
              ? 'This pickup is on your way and won\'t add much time' 
              : 'This pickup requires a detour from your current location'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 text-center">
          <MapPin size={16} className="text-primary mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-primary">{routeInfo.distance}</div>
          <div className="text-[10px] md:text-xs text-neutral-600">km away</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <Clock size={16} className="text-secondary mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-secondary">{routeInfo.duration}</div>
          <div className="text-[10px] md:text-xs text-neutral-600">minutes</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <TrendingUp size={16} className="text-accent mx-auto mb-1" />
          <div className="text-lg md:text-xl font-bold text-accent">{isConvenient ? 'Low' : 'Med'}</div>
          <div className="text-[10px] md:text-xs text-neutral-600">detour</div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" fullWidth onClick={onDecline}>
          Decline
        </Button>
        <Button variant="primary" fullWidth onClick={onAccept}>
          Accept Request
        </Button>
      </div>
    </motion.div>
  )
}

export default RouteAwareAvailability
