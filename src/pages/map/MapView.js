import React, { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { Search, MapPin, List, Locate, SlidersHorizontal, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFoodItems, getFoodImageUrl } from '../../lib/foodItems'
import { useAuth } from '../../context/AuthContext'
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM } from '../../config/mapbox'
import { calculateDistance, formatDistance } from '../../utils/distance'
import { Button } from '../../components/common/FormElements'
import FoodCard from '../../components/posts/FoodCard'
import { Link } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'

const MapView = () => {
  const { user } = useAuth()
  const [viewport, setViewport] = useState({
    longitude: user?.location?.lng || DEFAULT_CENTER.lng,
    latitude: user?.location?.lat || DEFAULT_CENTER.lat,
    zoom: DEFAULT_ZOOM
  })
  const [mapLoaded, setMapLoaded] = useState(false)
  
  const [viewMode, setViewMode] = useState('list') // Start with list view
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    foodType: '',
    isDonation: null,
    pickup: null,
    delivery: null,
    radius: 10
  })

  const { data: foodItems } = useQuery({
    queryKey: ['foodItems', filters],
    queryFn: () => {
      const queryFilters = {}
      if (filters.foodType) queryFilters.foodType = filters.foodType
      if (filters.isDonation !== null) queryFilters.isDonation = filters.isDonation
      return getFoodItems(queryFilters)
    }
  })

  const items = foodItems?.documents || []

  // Filter by radius and other criteria
  const filteredItems = items.filter(item => {
    if (!item.pickupAddress) return false
    
    // Distance filter
    if (user?.location) {
      const distance = calculateDistance(
        user.location.lat,
        user.location.lng,
        item.pickupAddress.lat,
        item.pickupAddress.lng
      )
      if (distance > filters.radius) return false
    }
    
    // Pickup/Delivery filter
    if (filters.pickup !== null && item.pickup !== filters.pickup) return false
    if (filters.delivery !== null && item.delivery !== filters.delivery) return false
    
    return true
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data.features || [])
    } catch (error) {
      console.error('Search error:', error)
    }
  }

  const handleSelectLocation = (result) => {
    const [lng, lat] = result.center
    setViewport({ ...viewport, longitude: lng, latitude: lat, zoom: 13 })
    setSearchResults([])
    setSearchQuery('')
  }

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setViewport({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          zoom: 13
        })
      })
    }
  }

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-4">
      {/* Filters Sidebar - Desktop */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6 overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Filters
          </h2>
          <button onClick={() => setShowFilters(false)} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Search Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Search Location
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter city or address..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
            />
            
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-neutral-200 max-h-60 overflow-y-auto z-10">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectLocation(result)}
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
          <button
            onClick={handleUseMyLocation}
            className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors"
          >
            <Locate size={16} />
            Use My Location
          </button>
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Radius: {filters.radius}km
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={filters.radius}
            onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>

        {/* Food Type */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Food Type
          </label>
          <select
            value={filters.foodType}
            onChange={(e) => setFilters({ ...filters, foodType: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
          >
            <option value="">All Types</option>
            <option value="meal">Meal</option>
            <option value="baked">Baked Goods</option>
            <option value="produce">Produce</option>
            <option value="snack">Snack</option>
            <option value="beverage">Beverage</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Donation */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isDonation === true}
              onChange={(e) => setFilters({ ...filters, isDonation: e.target.checked ? true : null })}
              className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-neutral-700">Free/Donation Only</span>
          </label>
        </div>

        {/* Pickup/Delivery */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.pickup === true}
              onChange={(e) => setFilters({ ...filters, pickup: e.target.checked ? true : null })}
              className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-neutral-700">Pickup Available</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.delivery === true}
              onChange={(e) => setFilters({ ...filters, delivery: e.target.checked ? true : null })}
              className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-neutral-700">Delivery Available</span>
          </label>
        </div>

        {/* Results Count */}
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-600">
            <strong>{filteredItems.length}</strong> items found
          </p>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* View Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                viewMode === 'map'
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <MapPin size={18} />
              Map
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <List size={18} />
              List
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-4 py-2 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>
        </div>

        {/* Map View */}
        {viewMode === 'map' && filteredItems.length > 0 && (
          <div className="flex-1 rounded-2xl overflow-hidden border border-neutral-200 relative">
            <Map
              {...viewport}
              onMove={(evt) => setViewport(evt.viewState)}
              onLoad={() => {
                setMapLoaded(true)
              }}
              mapStyle={MAP_STYLES.STREETS}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              attributionControl={false}
            >
              <NavigationControl position="top-right" />
              <GeolocateControl position="top-right" />
              
              {filteredItems.map((item) => {
                const hasValidCoords = item.pickupAddress && 
                  typeof item.pickupAddress.lat === 'number' && 
                  typeof item.pickupAddress.lng === 'number' &&
                  !isNaN(item.pickupAddress.lat) && !isNaN(item.pickupAddress.lng)
                
                return hasValidCoords ? (
                  <Marker
                    key={item.$id}
                    longitude={item.pickupAddress.lng}
                    latitude={item.pickupAddress.lat}
                    onClick={(e) => {
                      e.originalEvent.stopPropagation()
                      setSelectedItem(item)
                    }}
                  >
                    <button className="p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <MapPin size={20} />
                    </button>
                  </Marker>
                ) : null
              })}
            </Map>

            {/* Selected Item Popup */}
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white rounded-xl shadow-xl border border-neutral-200 p-4"
              >
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-lg"
                >
                  <X size={16} />
                </button>
                
                <Link to={`/food/${selectedItem.$id}`}>
                  <div className="flex gap-3">
                    <img
                      src={selectedItem.images?.[0] ? getFoodImageUrl(selectedItem.images[0], 100, 100) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                      alt={selectedItem.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-neutral-900 mb-1">{selectedItem.title}</h3>
                      <p className="text-sm text-primary font-bold">
                        {selectedItem.isDonation ? 'Free' : `$${selectedItem.price?.toFixed(2)}`}
                      </p>
                      {user?.location && (
                        <p className="text-xs text-neutral-600 mt-1">
                          {formatDistance(calculateDistance(
                            user.location.lat,
                            user.location.lng,
                            selectedItem.pickupAddress.lat,
                            selectedItem.pickupAddress.lng
                          ))} away
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item, index) => (
                <FoodCard key={item.$id} item={item} index={index} />
              ))}
            </div>
            
            {filteredItems.length === 0 && (
              <div className="text-center py-20">
                <MapPin size={48} className="mx-auto text-neutral-300 mb-4" />
                <h3 className="text-xl font-bold text-neutral-900 mb-2">No items found</h3>
                <p className="text-neutral-600">Try adjusting your filters or search area</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MapView
