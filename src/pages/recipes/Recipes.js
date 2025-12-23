import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Filter, SlidersHorizontal, X, PlusCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { useOutletContext } from 'react-router-dom'
import { getRecipes } from '../../lib/recipes'
import RecipeCard from '../../components/recipes/RecipeCard'
import CreateRecipeModal from '../../components/recipes/CreateRecipeModal'
import Loader from '../../components/common/Loader'
import { toast } from 'react-toastify'

const FILTERS = [
  { value: 'all', label: 'All Recipes' },
  { value: 'quick', label: 'Quick (<30min)' },
  { value: 'medium', label: 'Medium (30-60min)' },
  { value: 'long', label: 'Long (>60min)' }
]

const Recipes = () => {
  const { user } = useAuth()
  const { searchQuery = '' } = useOutletContext() || {}
  const [activeFilter, setActiveFilter] = useState('all')
  const [showCreateRecipe, setShowCreateRecipe] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState({
    myRecipes: false,
    withImage: false
  })

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes', activeFilter],
    queryFn: () => {
      const filters = {}
      if (activeFilter === 'quick') {
        filters.cookTimeMax = 30
      } else if (activeFilter === 'medium') {
        filters.cookTimeMax = 60
      }
      return getRecipes(filters)
    }
  })

  const items = recipes?.documents || []

  const searchedItems = searchQuery
    ? items.filter(recipe => 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  const filteredItems = searchedItems.filter(recipe => {
    if (activeFilter === 'quick' && recipe.cookTimeMinutes > 30) return false
    if (activeFilter === 'medium' && (recipe.cookTimeMinutes <= 30 || recipe.cookTimeMinutes > 60)) return false
    if (activeFilter === 'long' && recipe.cookTimeMinutes <= 60) return false
    if (advancedFilters.myRecipes && recipe.userId !== user?.$id) return false
    if (advancedFilters.withImage && !recipe.imageId) return false
    return true
  })

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Recipes
        </h1>
        <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Discover and share delicious recipes from the community
        </p>
      </motion.div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
          {FILTERS.map((filter, index) => (
            <motion.button
              key={filter.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setActiveFilter(filter.value)}
              className={`px-6 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex-shrink-0 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2"
        >
          <SlidersHorizontal size={20} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-neutral-900">Advanced Filters</h3>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedFilters.myRecipes}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, myRecipes: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">My Recipes Only</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={advancedFilters.withImage}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, withImage: e.target.checked })}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-neutral-700">With Image</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {!isLoading && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((recipe, index) => (
            <RecipeCard key={recipe.$id} recipe={recipe} index={index} />
          ))}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat size={40} className="text-primary" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            No Recipes Yet
          </h3>
          <p className="text-neutral-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            Be the first to share a recipe with the community!
          </p>
          {user?.isVerified && (
            <button
              onClick={() => setShowCreateRecipe(true)}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle size={20} />
              Create Recipe
            </button>
          )}
        </motion.div>
      )}

      {user?.isVerified ? (
        <button
          onClick={() => setShowCreateRecipe(true)}
          className="fixed bottom-24 lg:bottom-8 right-6 w-16 h-16 bg-secondary hover:bg-secondary/90 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110"
        >
          <ChefHat size={28} />
        </button>
      ) : (
        <button
          onClick={() => toast.info('Please verify your email to create recipes')}
          className="fixed bottom-24 lg:bottom-8 right-6 w-16 h-16 bg-neutral-300 text-neutral-500 rounded-full shadow-2xl flex items-center justify-center z-50 cursor-not-allowed"
        >
          <ChefHat size={28} />
        </button>
      )}

      <CreateRecipeModal isOpen={showCreateRecipe} onClose={() => setShowCreateRecipe(false)} />
    </div>
  )
}

export default Recipes
