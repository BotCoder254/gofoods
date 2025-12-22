import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Map, Marker, Source, Layer } from 'react-map-gl/mapbox'
import mapboxgl from 'mapbox-gl'
import { MapPin, Navigation, Clock, ArrowLeft, Play, Pause, RotateCcw, Calendar, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getRequestById } from '../../lib/requests'
import { getFoodItemById } from '../../lib/foodItems'
import { getUserById } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/common/Loader'
import { formatDate } from '../../utils/helpers'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

const RouteReplay = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [viewport, setViewport] = useState({
    latitude: 40.7128,
    longitude: -74.0060,
    zoom: 13
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const mapRef = useRef()
  const intervalRef = useRef(null)

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

  const { data: owner } = useQuery({
    queryKey: ['user', request?.ownerId],
    queryFn: () => getUserById(request.ownerId),
    enabled: !!request?.ownerId
  })

  const { data: requester } = useQuery({
    queryKey: ['user', request?.requesterId],
    queryFn: () => getUserById(request.requesterId),
    enabled: !!request?.requesterId
  })

  const routePath = request?.routePath ? 
    (typeof request.routePath === 'string' ? JSON.parse(request.routePath) : request.routePath) 
    : []

  useEffect(() => {
    if (routePath.length > 0 && mapLoaded && mapRef.current) {
      const coordinates = routePath.map(p => [p.lng, p.lat])
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord)
      }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))
      
      mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 })
    }
  }, [routePath, mapLoaded])

  useEffect(() => {
    if (isPlaying && currentIndex < routePath.length - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= routePath.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1000 / playbackSpeed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, currentIndex, routePath.length, playbackSpeed])

  const handlePlayPause = () => {
    if (currentIndex >= routePath.length - 1) {
      setCurrentIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentIndex(0)
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

  const completedRouteLayer = {
    id: 'completed-route',
    type: 'line',
    paint: {
      'line-color': '#10B981',
      'line-width': 5,
      'line-opacity': 0.9
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  if (!request || !routePath || routePath.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 text-center"
        >
          <div className="p-4 bg-error/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <MapPin size={40} className="text-error" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Route Not Available</h2>
          <p className="text-neutral-600 mb-6">
            This request doesn't have route data available for replay.
          </p>
          <button
            onClick={() => navigate('/history')}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to History
          </button>
        </motion.div>
      </div>
    )
  }

  const currentPosition = routePath[currentIndex]
  const completedPath = routePath.slice(0, currentIndex + 1)
  const remainingPath = routePath.slice(currentIndex)

  const completedGeometry = {
    type: 'LineString',
    coordinates: completedPath.map(p => [p.lng, p.lat])
  }

  const remainingGeometry = {
    type: 'LineString',
    coordinates: remainingPath.map(p => [p.lng, p.lat])
  }

  const progress = ((currentIndex / (routePath.length - 1)) * 100).toFixed(0)

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/history')}
        className="flex items-center gap-2 text-neutral-600 hover:text-primary transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to History</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Route Replay
            </h1>
            <p className="text-neutral-600">{foodItem?.title || 'Loading...'}</p>
          </div>
          {request.rating && (
            <div className="flex items-center gap-1 px-3 py-2 bg-accent/10 rounded-full">
              <span className="text-accent font-bold text-lg">{request.rating}</span>
              <span className="text-accent">★</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
            <Calendar size={18} className="text-primary" />
            <div>
              <div className="text-xs text-neutral-600">Completed</div>
              <div className="text-sm font-medium text-neutral-900">
                {formatDate(request.completedAt || request.$updatedAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
            <Package size={18} className="text-secondary" />
            <div>
              <div className="text-xs text-neutral-600">Type</div>
              <div className="text-sm font-medium text-neutral-900 capitalize">
                {request.pickupOrDelivery}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
            <Navigation size={18} className="text-accent" />
            <div>
              <div className="text-xs text-neutral-600">Points</div>
              <div className="text-sm font-medium text-neutral-900">{routePath.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-lg">
            <Clock size={18} className="text-warning" />
            <div>
              <div className="text-xs text-neutral-600">Progress</div>
              <div className="text-sm font-medium text-neutral-900">{progress}%</div>
            </div>
          </div>
        </div>
      </motion.div>

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
        >
          {completedPath.length > 1 && (
            <>
              <Source id="completed-casing" type="geojson" data={{ type: 'Feature', geometry: completedGeometry }}>
                <Layer {...routeCasingLayer} />
              </Source>
              <Source id="completed-route" type="geojson" data={{ type: 'Feature', geometry: completedGeometry }}>
                <Layer {...completedRouteLayer} />
              </Source>
            </>
          )}

          {remainingPath.length > 1 && (
            <>
              <Source id="remaining-casing" type="geojson" data={{ type: 'Feature', geometry: remainingGeometry }}>
                <Layer {...routeCasingLayer} />
              </Source>
              <Source id="remaining-route" type="geojson" data={{ type: 'Feature', geometry: remainingGeometry }}>
                <Layer {...routeLayer} />
              </Source>
            </>
          )}

          {routePath[0] && (
            <Marker latitude={routePath[0].lat} longitude={routePath[0].lng} anchor="bottom">
              <div className="relative">
                <div className="bg-white p-1 rounded-full shadow-2xl">
                  <div className="bg-secondary text-white p-2 rounded-full">
                    <MapPin size={16} fill="white" strokeWidth={0} />
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-secondary text-white text-xs px-2 py-1 rounded-full">
                  Start
                </div>
              </div>
            </Marker>
          )}

          {routePath[routePath.length - 1] && (
            <Marker latitude={routePath[routePath.length - 1].lat} longitude={routePath[routePath.length - 1].lng} anchor="bottom">
              <div className="relative">
                <div className="bg-white p-1 rounded-full shadow-2xl">
                  <div className="bg-accent text-white p-2 rounded-full">
                    <MapPin size={16} fill="white" strokeWidth={0} />
                  </div>
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-white" />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-white text-xs px-2 py-1 rounded-full">
                  End
                </div>
              </div>
            </Marker>
          )}

          {currentPosition && (
            <Marker latitude={currentPosition.lat} longitude={currentPosition.lng} anchor="center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative"
              >
                <div className="absolute -inset-3 bg-primary/20 rounded-full animate-pulse" />
                <div className="relative w-5 h-5 bg-primary rounded-full border-3 border-white shadow-xl">
                  <div className="absolute inset-1 bg-white rounded-full" />
                </div>
              </motion.div>
            </Marker>
          )}
        </Map>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl p-4 w-[90%] max-w-md"
        >
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button
              onClick={handleReset}
              className="p-3 bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={routePath.length - 1}
                value={currentIndex}
                onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="px-3 py-2 bg-neutral-100 rounded-lg text-sm font-medium"
            >
              <option value="0.5">0.5x</option>
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="4">4x</option>
            </select>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Point {currentIndex + 1} of {routePath.length}</span>
            <span>{progress}% Complete</span>
          </div>
        </motion.div>
      </motion.div>

      {(owner || requester) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 md:p-6"
        >
          <h3 className="font-bold text-lg mb-4">Trip Participants</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {owner && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <img
                  src={`https://ui-avatars.com/api/?name=${owner.displayName}&background=FF5136&color=fff`}
                  alt={owner.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-bold text-neutral-900">{owner.displayName}</div>
                  <div className="text-sm text-neutral-600">Provider</div>
                </div>
              </div>
            )}
            {requester && (
              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                <img
                  src={`https://ui-avatars.com/api/?name=${requester.displayName}&background=3B82F6&color=fff`}
                  alt={requester.displayName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-bold text-neutral-900">{requester.displayName}</div>
                  <div className="text-sm text-neutral-600">Requester</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default RouteReplay
