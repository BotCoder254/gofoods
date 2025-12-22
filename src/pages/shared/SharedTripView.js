import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox'
import { MapPin, Navigation, Clock, Shield, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getSharedTrip } from '../../lib/requests'
import { getFoodItemById } from '../../lib/foodItems'
import { getUserById } from '../../lib/users'
import { client, DATABASE_ID } from '../../config/appwrite'
import Loader from '../../components/common/Loader'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN
const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID || 'requests'

const SharedTripView = () => {
  const { shareToken } = useParams()
  const [viewport, setViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 13
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [route, setRoute] = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [liveLocation, setLiveLocation] = useState(null)
  const mapRef = useRef()
  const unsubscribeRef = useRef(null)

  const { data: request, isLoading } = useQuery({
    queryKey: ['sharedTrip', shareToken],
    queryFn: () => getSharedTrip(shareToken),
    enabled: !!shareToken
  })

  const { data: foodItem } = useQuery({
    queryKey: ['foodItem', request?.foodItemId],
    queryFn: () => getFoodItemById(request.foodItemId),
    enabled: !!request?.foodItemId
  })

  const { data: owner } = useQuery({
    queryKey: ['user', request?.ownerId],
    queryFn: () => getUserById(request.ownerId),
    enabled: !!request?.ownerId
  })

  useEffect(() => {
    if (!request?.$id) return

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${REQUESTS_COLLECTION_ID}.documents.${request.$id}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedRequest = response.payload
          if (updatedRequest.ownerLocation) {
            const location = typeof updatedRequest.ownerLocation === 'string'
              ? JSON.parse(updatedRequest.ownerLocation)
              : updatedRequest.ownerLocation
            setLiveLocation(location)
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
  }, [request?.$id])

  useEffect(() => {
    if (request?.requesterLocation && liveLocation && mapLoaded) {
      const requesterLoc = typeof request.requesterLocation === 'string'
        ? JSON.parse(request.requesterLocation)
        : request.requesterLocation
      fetchRoute(requesterLoc, liveLocation)
    }
  }, [liveLocation, mapLoaded, request])

  const fetchRoute = async (start, end) => {
    if (!start?.lat || !start?.lng || !end?.lat || !end?.lng || !MAPBOX_TOKEN) return

    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}&steps=true&overview=full`
      )
      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0]
        setRoute(routeData.geometry)
        setRouteInfo({
          distance: (routeData.distance / 1000).toFixed(1),
          duration: Math.round(routeData.duration / 60)
        })

        if (mapRef.current && mapRef.current.getMap) {
          const bounds = [
            [start.lng, start.lat],
            [end.lng, end.lat]
          ]
          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 })
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error)
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

  if (isLoading) {
    return <Loader fullScreen />
  }

  if (!request || !request.shareEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="p-4 bg-error/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle size={40} className="text-error" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Trip Not Found</h2>
          <p className="text-neutral-600">
            This trip link is invalid or has been disabled by the user.
          </p>
        </motion.div>
      </div>
    )
  }

  const requesterLocation = request.requesterLocation
    ? typeof request.requesterLocation === 'string'
      ? JSON.parse(request.requesterLocation)
      : request.requesterLocation
    : null

  return (
    <div className="min-h-screen bg-neutral-50 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/10 rounded-full">
              <Shield size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Shared Trip</h1>
              <p className="text-sm text-neutral-600">Live tracking enabled</p>
            </div>
          </div>

          {owner && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <img
                src={`https://ui-avatars.com/api/?name=${owner.displayName}&background=FF5136&color=fff`}
                alt={owner.displayName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <div className="font-bold text-neutral-900">{owner.displayName}</div>
                <div className="text-sm text-neutral-600">Food Provider</div>
              </div>
            </div>
          )}
        </motion.div>

        {routeInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Navigation size={20} className="text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{routeInfo.distance} km</div>
              <div className="text-xs text-neutral-600 mt-1">Distance</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4 text-center">
              <Clock size={20} className="text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary">{routeInfo.duration} min</div>
              <div className="text-xs text-neutral-600 mt-1">ETA</div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-lg"
        >
          <Map
            ref={mapRef}
            {...viewport}
            onMove={evt => setViewport(evt.viewState)}
            onLoad={() => setMapLoaded(true)}
            mapStyle="mapbox://styles/mapbox/standard"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
            interactive={true}
          >
            <NavigationControl position="top-right" />

            {requesterLocation && (
              <Marker
                latitude={requesterLocation.lat}
                longitude={requesterLocation.lng}
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

            {liveLocation && (
              <Marker
                latitude={liveLocation.lat}
                longitude={liveLocation.lng}
                anchor="bottom"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative"
                >
                  <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                  <div className="absolute -inset-3 bg-primary/30 rounded-full animate-pulse" />
                  <div className="relative">
                    <div className="bg-white p-1 rounded-full shadow-2xl">
                      <div className="bg-primary text-white p-2.5 rounded-full">
                        <MapPin size={20} fill="white" strokeWidth={0} />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-white" />
                  </div>
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

          {liveLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 bg-primary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Live Tracking Active
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Shield size={20} className="text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 mb-1">Safety Information</h3>
              <p className="text-sm text-neutral-600">
                This is a live shared trip. The location updates automatically as the provider moves.
                This link will stop working once the trip is completed or sharing is disabled.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SharedTripView
