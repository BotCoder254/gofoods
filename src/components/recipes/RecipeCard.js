import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, ChefHat, Link as LinkIcon } from 'lucide-react'
import { getRecipeImageUrl } from '../../lib/recipes'

const RecipeCard = ({ recipe, index }) => {
  const coverImage = recipe.imageId
    ? getRecipeImageUrl(recipe.imageId, 400, 400)
    : 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/recipe/${recipe.$id}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-all group">
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
            <img
              src={coverImage}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {recipe.linkedFoodItemId && (
                <span className="px-3 py-1 bg-accent text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <LinkIcon size={12} />
                  Linked
                </span>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {recipe.title}
            </h3>

            {recipe.description && (
              <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                {recipe.description}
              </p>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-neutral-600">
                  <Clock size={16} className="text-primary" />
                  <span>{recipe.cookTimeMinutes} min</span>
                </div>
                
                {recipe.servings && (
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <Users size={16} className="text-secondary" />
                    <span>{recipe.servings}</span>
                  </div>
                )}
              </div>

              <div className="p-1.5 bg-primary/10 rounded-lg">
                <ChefHat size={18} className="text-primary" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default RecipeCard
