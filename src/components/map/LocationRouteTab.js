import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Map, Marker, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { MapPin, Navigation, Clock, TrendingUp, Loader as LoaderIcon, Radio, Share2, Copy, Check, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { client, DATABASE_ID, FOODS_COLLECTION_ID } from '../../config/appwrite'
import { updateLiveLocation, clearLiveLocation } from '../../lib/foodItems'
import { enableTripSharing, disableTripSharing, saveRouteSnapshot } from '../../lib/requests'
import { toast } from 'react-toastify'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

const LocationRouteTab = ({ foodItem, enableTracking = false, requestId = null, activeRequest = null }) => {
  const { user } = useAuth()
  
  if (!MAPBOX_TOKEN) {
    console.error('Mapbox token is missing! Please check your .env file.')
  }
  
  const initialLat = foodItem.pickupAddress?.lat || 40.7128
  const initialLng = foodItem.pickupAddress?.lng || -74.0060
  
  const [viewport, setViewport] = useState({
    latitude: initialLat,
    longitude: initialLng,
    zoom: 13
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [route, setRoute] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [liveLocation, setLiveLocation] = useState(null)
  const [trackingActive, setTrackingActive] = useState(false)
  const [ownerTrackingEnabled, setOwnerTrackingEnabled] = useState(false)
  const [tripSharingEnabled, setTripSharingEnabled] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const mapRef = useRef()
  const watchIdRef = useRef(null)
  const unsubscribeRef = useRef(null)
  const updateIntervalRef = useRef(null)

  const hasValidLocation = foodItem.pickupAddress && 
    typeof foodItem.pickupAddress.lat === 'number' && 
    typeof foodItem.pickupAddress.lng === 'number' &&
    !isNaN(foodItem.pickupAddress.lat) && 
    !isNaN(foodItem.pickupAddress.lng)

  useEffect(() => {
    if (user?.location) {
      setUserLocation({ lat: user.location.lat, lng: user.location.lng })
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('High accuracy location failed:', error)
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              })
            },
            (err) => {
              console.error('Location error:', err)
              toast.error('Unable to get your location. Please enable location services.')
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
          )
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      )
    }
  }, [user, foodItem])

  useEffect(() => {
    if (userLocation && foodItem.pickupAddress && mapLoaded) {
      fetchRoute(userLocation, foodItem.pickupAddress)
    }
  }, [userLocation, foodItem.pickupAddress, mapLoaded])

  useEffect(() => {
    if (userLocation && liveLocation && trackingActive && mapLoaded) {
      fetchRoute(userLocation, liveLocation)
    }
  }, [liveLocation, trackingActive, mapLoaded])

  useEffect(() => {
    if (!enableTracking || !foodItem.$id) return

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${FOODS_COLLECTION_ID}.documents.${foodItem.$id}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedItem = response.payload
          if (updatedItem.liveLocation) {
            const location = typeof updatedItem.liveLocation === 'string' 
              ? JSON.parse(updatedItem.liveLocation) 
              : updatedItem.liveLocation
            setLiveLocation(location)
            setTrackingActive(true)
          }
        }
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [enableTracking, foodItem.$id])

  useEffect(() => {
    if (!ownerTrackingEnabled || user?.$id !== foodItem.ownerId) return

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: position.timestamp
          }
          setLiveLocation(newLocation)
          setTrackingActive(true)
        },
        (error) => {
          console.error('Error watching position:', error)
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current)
          }
          watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: position.timestamp
              }
              setLiveLocation(newLocation)
              setTrackingActive(true)
            },
            (err) => {
              console.error('Low accuracy tracking failed:', err)
              toast.error('Unable to track location. Please check location permissions.')
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
          )
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [ownerTrackingEnabled, user?.$id, foodItem.ownerId])

  useEffect(() => {
    if (!liveLocation || !ownerTrackingEnabled || user?.$id !== foodItem.ownerId) return

    const updateLocation = async () => {
      try {
        await updateLiveLocation(foodItem.$id, liveLocation)
        
        if (requestId && activeRequest?.status === 'accepted') {
          await saveRouteSnapshot(requestId, liveLocation)
        }
      } catch (error) {
        console.error('Error updating live location:', error)
      }
    }

    updateLocation()
    updateIntervalRef.current = setInterval(updateLocation, 10000)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [liveLocation, ownerTrackingEnabled, user?.$id, foodItem.ownerId, foodItem.$id, requestId, activeRequest])

  const handleToggleTracking = async () => {
    if (ownerTrackingEnabled) {
      setOwnerTrackingEnabled(false)
      setTrackingActive(false)
      setLiveLocation(null)
      try {
        await clearLiveLocation(foodItem.$id)
        toast.success('Live tracking disabled')
      } catch (error) {
        console.error('Error clearing location:', error)
      }
    } else {
      setOwnerTrackingEnabled(true)
      toast.success('Live tracking enabled')
    }
  }

  const handleToggleTripSharing = async () => {
    if (!requestId || !activeRequest) {
      toast.error('No active request found')
      return
    }

    try {
      if (tripSharingEnabled) {
        await disableTripSharing(requestId)
        setTripSharingEnabled(false)
        setShareLink('')
        toast.success('Trip sharing disabled')
      } else {
        const response = await enableTripSharing(requestId)
        const link = `${window.location.origin}/shared-trip/${response.shareToken}`
        setShareLink(link)
        setTripSharingEnabled(true)
        toast.success('Trip sharing enabled')
      }
    } catch (error) {
      console.error('Error toggling trip sharing:', error)
      toast.error('Failed to toggle trip sharing')
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    toast.success('Link copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchRoute = async (start, end) => {
    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng || !MAPBOX_TOKEN || !mapLoaded) return
    
    setLoading(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}&steps=true&overview=full&alternatives=false`
      )
      const data = await response.json()
      
      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        setRoute(routeData.geometry)
        setRouteInfo({
          distance: (routeData.distance / 1000).toFixed(1),
          duration: Math.round(routeData.duration / 60),
          steps: routeData.legs[0].steps
        })

        if (mapRef.current && mapRef.current.getMap) {
          try {
            const bounds = [
              [start.lng, start.lat],
              [end.lng, end.lat]
            ]
            mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 })
          } catch (err) {
            console.error('Error fitting bounds:', err)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
    } finally {
      setLoading(false)
    }
  }

  const routeLayer = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#FF5136',
      'line-width': 5,
      'line-opacity': 0.9
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  }

  const routeCasingLayer = {
    id: 'route-casing',
    type: 'line',
    paint: {
      'line-color': '#000000',
      'line-width': 7,
      'line-opacity': 0.3
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  }

  const displayLocation = liveLocation || foodItem.pickupAddress

  const isValidCoordinate = (coord) => {
    return coord && typeof coord.lat === 'number' && typeof coord.lng === 'number' && 
           !isNaN(coord.lat) && !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180
  }

  const validDisplayLocation = isValidCoordinate(displayLocation)
  const hasValidUserLocation = isValidCoordinate(userLocation)

  const openInMaps = () => {
    if (!displayLocation?.lat || !displayLocation?.lng) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${displayLocation.lat},${displayLocation.lng}`
    window.open(url, '_blank')
  }

  if (!hasValidLocation) {
    return (
      <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
        <MapPin size={48} className="mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Location Not Available</h3>
        <p className="text-neutral-600">This item doesn't have a valid pickup location set.</p>
      </div>
    )
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200">
        <MapPin size={48} className="mx-auto text-neutral-300 mb-4" />
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Map Configuration Error</h3>
        <p className="text-neutral-600">Mapbox token is not configured. Please contact support.</p>
        <button
          onClick={openInMaps}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Open in Google Maps
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4">
      {user?.$id === foodItem.ownerId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Radio size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-bold text-neutral-900 text-sm md:text-base">Live Location Tracking</div>
                <div className="text-xs md:text-sm text-neutral-600">Share your real-time location with requesters</div>
              </div>
            </div>
            <button
              onClick={handleToggleTracking}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ownerTrackingEnabled ? 'bg-primary' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  ownerTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </motion.div>
      )}

      {activeRequest && activeRequest.status === 'accepted' && user?.$id === activeRequest.requesterId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-accent/10 to-secondary/10 rounded-xl p-4 border border-accent/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Shield size={20} className="text-accent" />
              </div>
              <div>
                <div className="font-bold text-neutral-900 text-sm md:text-base">Safety Share</div>
                <div className="text-xs md:text-sm text-neutral-600">Share live trip with trusted contacts</div>
              </div>
            </div>
            <button
              onClick={handleToggleTripSharing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                tripSharingEnabled ? 'bg-accent' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  tripSharingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          <AnimatePresence>
            {tripSharingEnabled && shareLink && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-accent/20"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs md:text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2 flex items-center gap-1">
                  <Shield size={12} className="text-accent" />
                  Share this link with trusted contacts to let them track your trip
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {routeInfo && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-4"
        >
          <div className="bg-primary/10 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <Navigation size={16} className="text-primary mx-auto mb-1 md:mb-2 md:w-5 md:h-5" />
            <div className="text-lg md:text-2xl font-bold text-primary">{routeInfo.distance} km</div>
            <div className="text-[10px] md:text-xs text-neutral-600 mt-0.5 md:mt-1">Distance</div>
          </div>
          <div className="bg-secondary/10 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <Clock size={16} className="text-secondary mx-auto mb-1 md:mb-2 md:w-5 md:h-5" />
            <div className="text-lg md:text-2xl font-bold text-secondary">{routeInfo.duration} min</div>
            <div className="text-[10px] md:text-xs text-neutral-600 mt-0.5 md:mt-1">Duration</div>
          </div>
          <div className="bg-accent/10 rounded-lg md:rounded-xl p-3 md:p-4 text-center">
            <TrendingUp size={16} className="text-accent mx-auto mb-1 md:mb-2 md:w-5 md:h-5" />
            <div className="text-lg md:text-2xl font-bold text-accent">Optimal</div>
            <div className="text-[10px] md:text-xs text-neutral-600 mt-0.5 md:mt-1">Route</div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] rounded-xl md:rounded-2xl overflow-hidden border border-neutral-200 md:border-2 shadow-md md:shadow-lg"
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <LoaderIcon size={32} className="text-primary animate-spin" />
          </div>
        )}

        <Map
          ref={mapRef}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          onLoad={() => {
            setMapLoaded(true)
          }}
          mapStyle="mapbox://styles/mapbox/standard"
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          interactive={mapLoaded}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />

          {hasValidUserLocation && (
            <Marker
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              anchor="center"
            >
              <div className="relative">
                <div className="absolute -inset-3 bg-blue-500/20 rounded-full animate-ping" />
                <div className="relative w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-xl">
                  <div className="absolute inset-1 bg-white rounded-full" />
                </div>
              </div>
            </Marker>
          )}

          {validDisplayLocation && (
            <Marker
              latitude={displayLocation.lat}
              longitude={displayLocation.lng}
              anchor="bottom"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative"
              >
                {trackingActive && liveLocation && (
                  <>
                    <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                    <div className="absolute -inset-3 bg-primary/30 rounded-full animate-pulse" />
                  </>
                )}
                <div className="relative">
                  <div className="bg-white p-1 rounded-full shadow-2xl">
                    <div className="bg-primary text-white p-2.5 rounded-full">
                      <MapPin size={20} fill="white" strokeWidth={0} />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
                </div>
                {trackingActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap"
                  >
                    <div className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </Marker>
          )}

          {route && (
            <>
              <Source id="route-casing" type="geojson" data={{ type: 'Feature', geometry: route }}>
                <Layer {...routeCasingLayer} />
              </Source>
              <Source id="route" type="geojson" data={{ type: 'Feature', geometry: route }}>
                <Layer {...routeLayer} />
              </Source>
            </>
          )}
        </Map>

        {trackingActive && liveLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-2 left-2 md:top-4 md:left-4 bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full shadow-lg flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-bold"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse" />
            <span className="hidden sm:inline">Live Tracking Active</span>
            <span className="sm:hidden">Live</span>
          </motion.div>
        )}
      </motion.div>

      <div className="bg-neutral-50 rounded-lg md:rounded-xl p-3 md:p-4">
        <div className="flex items-start gap-2 md:gap-3">
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg">
            <MapPin size={18} className="text-primary md:w-5 md:h-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-sm md:text-base text-neutral-900 mb-0.5 md:mb-1">
              {trackingActive && liveLocation ? 'Current Location (Live)' : 'Pickup Location'}
            </div>
            <button
              onClick={openInMaps}
              className="text-xs md:text-sm text-primary hover:text-primary/80 underline text-left transition-colors"
            >
              {foodItem.pickupAddress?.placeName || 'View on map'}
            </button>
            {routeInfo && (
              <div className="text-[10px] md:text-xs text-neutral-600 mt-1 md:mt-2">
                Approximately {routeInfo.distance} km away • {routeInfo.duration} min drive
              </div>
            )}
          </div>
        </div>
      </div>

      {routeInfo?.steps && (
        <div className="bg-white rounded-lg md:rounded-xl border border-neutral-200 p-3 md:p-4">
          <h4 className="font-bold text-sm md:text-base text-neutral-900 mb-2 md:mb-3 flex items-center gap-2">
            <Navigation size={16} className="text-primary md:w-[18px] md:h-[18px]" />
            Turn-by-Turn Directions
          </h4>
          <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto">
            {routeInfo.steps.slice(0, 8).map((step, index) => (
              <div key={index} className="flex gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex-shrink-0 w-5 h-5 md:w-6 md:h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 text-neutral-700">
                  {step.maneuver.instruction}
                  <span className="text-neutral-500 ml-1 md:ml-2">
                    ({(step.distance / 1000).toFixed(1)} km)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationRouteTab
