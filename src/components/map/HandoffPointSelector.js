import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Check, X, Navigation2, Search, Loader as LoaderIcon, Navigation, Clock } from 'lucide-react'
import { Map, Marker, Source, Layer } from 'react-map-gl/mapbox'
import { Button } from '../common/FormElements'
import { toast } from 'react-toastify'
import { calculateDistance } from '../../utils/distance'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

const HandoffPointSelector = ({ isOpen, onClose, currentLocation, onSelect }) => {
  const [selectedPoint, setSelectedPoint] = useState(currentLocation)
  const [selectedPlaceName, setSelectedPlaceName] = useState('')
  const [viewport, setViewport] = useState({
    latitude: currentLocation?.lat || 40.7128,
    longitude: currentLocation?.lng || -74.0060,
    zoom: 14
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [route, setRoute] = useState(null)
  const [distance, setDistance] = useState(null)
  const [duration, setDuration] = useState(null)
  const mapRef = useRef()

  useEffect(() => {
    if (!currentLocation || !selectedPoint || !MAPBOX_TOKEN) return

    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${currentLocation.lng},${currentLocation.lat};${selectedPoint.lng},${selectedPoint.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
        )
        const data = await response.json()
        
        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0]
          setRoute(routeData.geometry)
          setDistance((routeData.distance / 1000).toFixed(2))
          setDuration(Math.round(routeData.duration / 60))
          
          // Fit bounds to show both points
          if (mapRef.current) {
            const bounds = [
              [currentLocation.lng, currentLocation.lat],
              [selectedPoint.lng, selectedPoint.lat]
            ]
            mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 })
          }
        }
      } catch (error) {
        console.error('Error fetching route:', error)
      }
    }

    fetchRoute()
  }, [currentLocation, selectedPoint])

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setSearchResults([])
      return
    }

    const searchTimeout = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5&proximity=${viewport.longitude},${viewport.latitude}`
        )
        const data = await response.json()
        setSearchResults(data.features || [])
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(searchTimeout)
  }, [searchQuery, viewport.longitude, viewport.latitude])

  const handleMapClick = async (event) => {
    const { lngLat } = event
    const newPoint = {
      lat: lngLat.lat,
      lng: lngLat.lng
    }
    setSelectedPoint(newPoint)
    setSearchResults([])
    
    // Reverse geocode to get place name
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${MAPBOX_TOKEN}`
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        setSelectedPlaceName(data.features[0].place_name)
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const handleSelectResult = (result) => {
    const [lng, lat] = result.center
    const newPoint = { lat, lng }
    setSelectedPoint(newPoint)
    setSelectedPlaceName(result.place_name)
    setViewport({ latitude: lat, longitude: lng, zoom: 15 })
    setSearchQuery(result.place_name)
    setSearchResults([])
  }

  const handleConfirm = () => {
    if (!selectedPoint) {
      toast.error('Please select a handoff point')
      return
    }
    onSelect({ ...selectedPoint, placeName: selectedPlaceName })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex-1 mr-4">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Select Handoff Point
            </h2>
            <p className="text-xs md:text-sm text-neutral-600">
              Search or tap on the map to choose a location
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg flex-shrink-0">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 md:p-6 border-b border-neutral-200">
          {/* Distance and Duration Info */}
          {distance && duration && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <Navigation size={16} className="text-primary mx-auto mb-1" />
                <div className="text-lg font-bold text-primary">{distance} km</div>
                <div className="text-xs text-neutral-600">Distance</div>
              </div>
              <div className="bg-secondary/10 rounded-lg p-3 text-center">
                <Clock size={16} className="text-secondary mx-auto mb-1" />
                <div className="text-lg font-bold text-secondary">{duration} min</div>
                <div className="text-xs text-neutral-600">Duration</div>
              </div>
            </div>
          )}
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a place..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none text-sm md:text-base"
            />
            {searching && (
              <LoaderIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={20} />
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
            >
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-neutral-900 truncate">
                        {result.text}
                      </div>
                      <div className="text-xs text-neutral-600 truncate">
                        {result.place_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        <div className="relative h-[300px] md:h-[400px]">
          <Map
            ref={mapRef}
            {...viewport}
            onMove={evt => setViewport(evt.viewState)}
            onClick={handleMapClick}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Current location marker */}
            {currentLocation && (
              <Marker
                latitude={currentLocation.lat}
                longitude={currentLocation.lng}
                anchor="bottom"
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-secondary/30 rounded-full animate-ping" />
                  <div className="relative w-4 h-4 bg-secondary rounded-full border-2 border-white shadow-lg" />
                </div>
              </Marker>
            )}
            
            {/* Selected point marker */}
            {selectedPoint && (
              <Marker
                latitude={selectedPoint.lat}
                longitude={selectedPoint.lng}
                anchor="bottom"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative"
                >
                  <div className="absolute -inset-3 bg-accent/30 rounded-full animate-pulse" />
                  <div className="bg-accent text-white p-3 rounded-full shadow-xl">
                    <MapPin size={24} fill="white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-accent" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-accent text-white text-xs px-3 py-1 rounded-full shadow-lg">
                    New Handoff Point
                  </div>
                </motion.div>
              </Marker>
            )}
            
            {/* Route Line */}
            {route && (
              <Source id="route" type="geojson" data={{ type: 'Feature', geometry: route }}>
                <Layer
                  id="route"
                  type="line"
                  paint={{
                    'line-color': '#FF5136',
                    'line-width': 4,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}
          </Map>

          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg text-xs md:text-sm">
            <div className="flex items-center gap-2 text-neutral-700">
              <Navigation2 size={16} className="text-primary" />
              <span className="font-medium">Tap anywhere to set location</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-neutral-200 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleConfirm} icon={Check}>
            Confirm Location
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default HandoffPointSelector
