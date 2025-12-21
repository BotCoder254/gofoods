import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Map, Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { Search, MapPin, X } from 'lucide-react'
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../config/mapbox'
import { Button } from '../common/FormElements'
import 'mapbox-gl/dist/mapbox-gl.css'

const LocationPicker = ({ onSelect, onClose, initialLocation }) => {
  const [viewport, setViewport] = useState({
    longitude: initialLocation?.lng || DEFAULT_CENTER.lng,
    latitude: initialLocation?.lat || DEFAULT_CENTER.lat,
    zoom: DEFAULT_ZOOM
  })
  
  const [marker, setMarker] = useState(
    initialLocation ? { lng: initialLocation.lng, lat: initialLocation.lat } : null
  )
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  const handleMapClick = useCallback((event) => {
    const { lng, lat } = event.lngLat
    setMarker({ lng, lat })
    reverseGeocode(lng, lat)
  }, [])

  const reverseGeocode = async (lng, lat) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const placeName = data.features[0].place_name
        setMarker({ lng, lat, placeName })
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setSearching(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data.features || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleSelectResult = (result) => {
    const [lng, lat] = result.center
    setViewport({ ...viewport, longitude: lng, latitude: lat, zoom: 14 })
    setMarker({ lng, lat, placeName: result.place_name })
    setSearchResults([])
    setSearchQuery('')
  }

  const handleConfirm = () => {
    if (marker) {
      onSelect({
        lng: marker.lng,
        lat: marker.lat,
        placeName: marker.placeName || 'Selected Location'
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[600px] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Select Your Location
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a location..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
            />
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-60 overflow-y-auto z-10">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-50 border-b border-neutral-100 last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-primary mt-1 flex-shrink-0" />
                      <span className="text-sm text-neutral-700">{result.place_name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <Map
            {...viewport}
            onMove={(evt) => setViewport(evt.viewState)}
            onClick={handleMapClick}
            mapStyle={MAP_STYLES.STREETS}
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" />
            <GeolocateControl position="top-right" />
            
            {marker && (
              <Marker longitude={marker.lng} latitude={marker.lat}>
                <div className="relative">
                  <MapPin size={40} className="text-primary fill-primary/20" />
                </div>
              </Marker>
            )}
          </Map>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
          <div className="flex-1">
            {marker?.placeName && (
              <div className="flex items-start gap-2">
                <MapPin size={18} className="text-primary mt-1 flex-shrink-0" />
                <span className="text-sm text-neutral-700">{marker.placeName}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirm} disabled={!marker}>
              Confirm Location
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default LocationPicker
