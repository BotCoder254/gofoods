import React from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, Users, ChefHat, Link as LinkIcon, Trash2, ShoppingBag, ListOrdered } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRecipeById, deleteRecipe, getRecipeImageUrl } from '../../lib/recipes'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/common/Loader'
import { Button } from '../../components/common/FormElements'
import RecipeComments from '../../components/recipes/RecipeComments'
import { toast } from 'react-toastify'

const RecipeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipeById(id)
  })

  const { data: owner } = useQuery({
    queryKey: ['user', recipe?.userId],
    queryFn: () => getUserById(recipe.userId),
    enabled: !!recipe?.userId
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes'])
      toast.success('Recipe deleted successfully')
      navigate('/recipes')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete recipe')
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Recipe not found</h2>
        <Button onClick={() => navigate('/recipes')} icon={ArrowLeft}>
          Back to Recipes
        </Button>
      </div>
    )
  }

  const coverImage = recipe.imageId
    ? getRecipeImageUrl(recipe.imageId, 800, 600)
    : 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop'

  const isOwner = user?.$id === recipe.userId

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/recipes')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Recipes</span>
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
          <div className="relative aspect-video overflow-hidden bg-neutral-100">
            <img
              src={coverImage}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-neutral-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {recipe.title}
                </h1>
                {recipe.description && (
                  <p className="text-neutral-600 text-lg mb-4">{recipe.description}</p>
                )}
              </div>
              {isOwner && (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this recipe?')) {
                      deleteMutation.mutate()
                    }
                  }}
                  className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Clock size={20} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Cook Time</div>
                  <div className="font-bold text-neutral-900">{recipe.cookTimeMinutes} min</div>
                </div>
              </div>

              {recipe.servings && (
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Users size={20} className="text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm text-neutral-600">Servings</div>
                    <div className="font-bold text-neutral-900">{recipe.servings}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <ChefHat size={20} className="text-accent" />
                </div>
                <div>
                  <div className="text-sm text-neutral-600">Difficulty</div>
                  <div className="font-bold text-neutral-900">
                    {recipe.cookTimeMinutes < 30 ? 'Easy' : recipe.cookTimeMinutes < 60 ? 'Medium' : 'Advanced'}
                  </div>
                </div>
              </div>
            </div>

            {owner && (
              <div className="flex items-center gap-3 mb-8 pb-8 border-b border-neutral-200">
                <img
                  src={owner.avatarFileId ? getAvatarUrl(owner.avatarFileId) : `https://ui-avatars.com/api/?name=${owner.displayName}&background=FF5136&color=fff`}
                  alt={owner.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="text-sm text-neutral-600">Recipe by</div>
                  <Link to={`/profile?userId=${owner.$id}`} className="font-bold text-neutral-900 hover:text-primary transition-colors">
                    {owner.displayName}
                  </Link>
                </div>
              </div>
            )}

            {recipe.linkedFoodItemId && (
              <div className="mb-8 p-4 bg-accent/5 border border-accent/20 rounded-xl">
                <div className="flex items-center gap-2 text-accent mb-2">
                  <LinkIcon size={18} />
                  <span className="font-bold">Linked Food Item</span>
                </div>
                <p className="text-sm text-neutral-600">
                  This recipe is linked to a food item available for purchase or sharing.
                </p>
                <Link
                  to={`/food/${recipe.linkedFoodItemId}`}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  View Food Item
                </Link>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={18} className="text-primary" />
                  </div>
                  Ingredients
                </h2>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                      <span className="text-neutral-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <ListOrdered size={18} className="text-secondary" />
                  </div>
                  Instructions
                </h2>
                <ol className="space-y-4">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-neutral-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>

        <RecipeComments recipeId={id} />
      </motion.div>
    </div>
  )
}

export default RecipeDetail
