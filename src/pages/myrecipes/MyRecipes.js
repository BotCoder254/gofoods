import React from 'react'
import { motion } from 'framer-motion'
import { ChefHat, PlusCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getRecipes } from '../../lib/recipes'
import RecipeCard from '../../components/recipes/RecipeCard'
import CreateRecipeModal from '../../components/recipes/CreateRecipeModal'
import Loader from '../../components/common/Loader'
import { toast } from 'react-toastify'

const MyRecipes = () => {
  const { user } = useAuth()
  const [showCreateRecipe, setShowCreateRecipe] = React.useState(false)

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['myRecipes', user?.$id],
    queryFn: () => getRecipes({ userId: user.$id }),
    enabled: !!user?.$id
  })

  const myRecipes = recipes?.documents || []

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          My Recipes
        </h1>
        <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manage your personal recipe collection
        </p>
      </motion.div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {!isLoading && myRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.$id} recipe={recipe} index={index} />
          ))}
        </div>
      )}

      {!isLoading && myRecipes.length === 0 && (
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
            Start building your recipe collection!
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

export default MyRecipes
