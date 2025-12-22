import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Navigation, Users, Clock } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequestById, updateRequestLocation, updateHandoffPoint, confirmCompletion } from '../../lib/requests'
import { getFoodItemById } from '../../lib/foodItems'
import { getUserById } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import { client, DATABASE_ID } from '../../config/appwrite'
import { Map, Marker, Source, Layer } from 'react-map-gl/mapbox'
import LiveETATracker from '../../components/map/LiveETATracker'
import GeofenceAlert from '../../components/map/GeofenceAlert'
import HandoffPointSelector from '../../components/map/HandoffPointSelector'
import SafetyCheckIn from '../../components/requests/SafetyCheckIn'
import Loader from '../../components/common/Loader'
import { Button } from '../../components/common/FormElements'
import { toast } from 'react-toastify'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN
const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID

const TrackingPage = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  
  const [viewport, setViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 13
  })
  const [userLocation, setUserLocation] = useState(null)
  const [otherPartyLocation, setOtherPartyLocation] = useState(null)
  const [route, setRoute] = useState(null)
  const [showHandoffSelector, setShowHandoffSelector] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const watchIdRef = useRef(null)
  const mapRef = useRef()

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequestById(requestId),
    enabled: !!requestId
  })

  const { data: foodItem } = useQuery({
    queryKey: ['foodItem', request?.foodItemId],
    queryFn: () => getFoodItemById(request.foodItemId),
    enabled: !!request?.foodItemId
  })

  const { data: otherParty } = useQuery({
    queryKey: ['user', request?.ownerId === user?.$id ? request?.requesterId : request?.ownerId],
    queryFn: () => getUserById(request.ownerId === user?.$id ? request.requesterId : request.ownerId),
    enabled: !!request && !!user
  })

  useEffect(() => {
    if (!navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        setUserLocation(newLocation)
        
        if (request) {
          const locationType = user?.$id === request.requesterId ? 'requester' : 'owner'
          updateRequestLocation(requestId, newLocation, locationType).catch(console.error)
        }
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [requestId, request, user])

  useEffect(() => {
    if (!requestId) return

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${REQUESTS_COLLECTION_ID}.documents.${requestId}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updated = response.payload
          const locationField = user?.$id === request?.requesterId ? 'ownerLocation' : 'requesterLocation'
          
          if (updated[locationField]) {
            const location = typeof updated[locationField] === 'string' 
              ? JSON.parse(updated[locationField]) 
              : updated[locationField]
            setOtherPartyLocation(location)
          }
          
          // Listen for handoff point updates
          if (updated.handoffPoint) {
            queryClient.invalidateQueries(['request', requestId])
          }
        }
      }
    )

    return () => unsubscribe()
  }, [requestId, request, user, queryClient])

  useEffect(() => {
    if (!userLocation || !otherPartyLocation || !MAPBOX_TOKEN) return

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${otherPartyLocation.lng},${otherPartyLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        )
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          setRoute(data.routes[0].geometry)
          
          if (mapRef.current) {
            const bounds = [
              [userLocation.lng, userLocation.lat],
              [otherPartyLocation.lng, otherPartyLocation.lat]
            ]
            mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 })
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error)
      }
    }

    fetchRoute()
  }, [userLocation, otherPartyLocation])

  const handoffMutation = useMutation({
    mutationFn: (point) => updateHandoffPoint(requestId, point),
    onSuccess: () => {
      queryClient.invalidateQueries(['request', requestId])
      toast.success('Handoff point updated')
    }
  })

  const completionMutation = useMutation({
    mutationFn: (data) => confirmCompletion(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['request', requestId])
      toast.success('Transaction completed successfully!')
      setTimeout(() => navigate('/requests'), 2000)
    }
  })

  if (isLoading) return <Loader fullScreen />

  if (!request) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Request not found</h2>
        <Button onClick={() => navigate('/requests')}>Back to Requests</Button>
      </div>
    )
  }

  const targetLocation = request.handoffPoint 
    ? (typeof request.handoffPoint === 'string' ? JSON.parse(request.handoffPoint) : request.handoffPoint)
    : otherPartyLocation

  const routeLayer = {
    id: 'route',
    type: 'line',
    paint: {
      'line-color': '#FF5136',
      'line-width': 4,
      'line-opacity': 0.8
    }
  }

  return (
    <div className="max-w-6xl mx-auto pb-6">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/requests')}
        className="flex items-center gap-2 text-neutral-600 hover:text-primary mb-4 md:mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium text-sm md:text-base">Back to Requests</span>
      </motion.button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {userLocation && targetLocation && request.status === 'accepted' && (
            <LiveETATracker
              currentLocation={userLocation}
              destination={targetLocation}
              isActive={true}
            />
          )}

          {userLocation && targetLocation && request.status === 'accepted' && (
            <GeofenceAlert
              userLocation={userLocation}
              targetLocation={targetLocation}
              radius={0.5}
              isActive={true}
              onEnter={() => toast.info('Other party notified of your arrival')}
            />
          )}

          <div className="relative h-[300px] md:h-[500px] rounded-xl md:rounded-2xl overflow-hidden border-2 border-neutral-200 shadow-lg">
            <Map
              ref={mapRef}
              {...viewport}
              onMove={evt => setViewport(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
            >
              {userLocation && (
                <Marker latitude={userLocation.lat} longitude={userLocation.lng} anchor="bottom">
                  <div className="relative">
                    <div className="absolute -inset-2 bg-secondary/30 rounded-full animate-ping" />
                    <div className="relative w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg" />
                  </div>
                </Marker>
              )}

              {otherPartyLocation && (
                <Marker latitude={otherPartyLocation.lat} longitude={otherPartyLocation.lng} anchor="bottom">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative"
                  >
                    <div className="absolute -inset-3 bg-primary/30 rounded-full animate-pulse" />
                    <div className="bg-primary text-white p-3 rounded-full shadow-xl">
                      <MapPin size={24} fill="white" />
                    </div>
                  </motion.div>
                </Marker>
              )}

              {request.handoffPoint && targetLocation && (
                <Marker 
                  latitude={targetLocation.lat} 
                  longitude={targetLocation.lng} 
                  anchor="bottom"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative"
                  >
                    <div className="bg-accent text-white p-3 rounded-full shadow-xl">
                      <MapPin size={24} fill="white" />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-accent" />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-white text-xs px-3 py-1 rounded-full shadow-lg">
                      Handoff Point
                    </div>
                  </motion.div>
                </Marker>
              )}

              {route && (
                <Source id="route" type="geojson" data={{ type: 'Feature', geometry: route }}>
                  <Layer {...routeLayer} />
                </Source>
              )}
            </Map>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6"
          >
            <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4">Request Details</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-primary" />
                <div>
                  <div className="text-xs text-neutral-600">Meeting with</div>
                  <div className="font-medium text-sm md:text-base">{otherParty?.displayName}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock size={18} className="text-secondary" />
                <div>
                  <div className="text-xs text-neutral-600">Status</div>
                  <div className="font-medium text-sm md:text-base capitalize">{request.status}</div>
                </div>
              </div>

              {foodItem && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-accent" />
                  <div>
                    <div className="text-xs text-neutral-600">Item</div>
                    <div className="font-medium text-sm md:text-base">{foodItem.title}</div>
                  </div>
                </div>
              )}
              
              {request.handoffPoint && (
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-1">
                    <MapPin size={14} className="text-accent flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-accent block">Custom Handoff Point Set</span>
                      {(() => {
                        try {
                          const handoff = typeof request.handoffPoint === 'string' ? JSON.parse(request.handoffPoint) : request.handoffPoint
                          return handoff.placeName && (
                            <span className="text-xs text-neutral-700 block mt-1">{handoff.placeName}</span>
                          )
                        } catch (e) {
                          return null
                        }
                      })()}
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600">Meeting location has been customized</p>
                </div>
              )}
            </div>
          </motion.div>

          {request.status === 'accepted' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6 space-y-3"
            >
              <h3 className="font-bold text-base md:text-lg mb-3">Quick Actions</h3>
              
              <Button
                variant="outline"
                fullWidth
                icon={MapPin}
                onClick={() => setShowHandoffSelector(true)}
              >
                Change Handoff Point
              </Button>

              <Button
                variant="primary"
                fullWidth
                icon={Navigation}
                onClick={() => setShowCheckIn(true)}
              >
                Confirm {request.pickupOrDelivery === 'pickup' ? 'Pickup' : 'Delivery'}
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      <HandoffPointSelector
        isOpen={showHandoffSelector}
        onClose={() => setShowHandoffSelector(false)}
        currentLocation={targetLocation || userLocation}
        onSelect={(point) => handoffMutation.mutate(point)}
      />

      <SafetyCheckIn
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onConfirm={(data) => completionMutation.mutate(data)}
        type={request.pickupOrDelivery}
        otherPartyName={otherParty?.displayName}
      />
    </div>
  )
}

export default TrackingPage
