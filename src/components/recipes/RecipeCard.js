import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, ChefHat, Link as LinkIcon, MessageCircle, Lock } from 'lucide-react'
import { getRecipeImageUrl } from '../../lib/recipes'
import { useQuery } from '@tanstack/react-query'
import { getRecipeComments } from '../../lib/recipeComments'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

const RecipeCard = ({ recipe, index }) => {
  const { user } = useAuth()
  
  const { data: comments = [] } = useQuery({
    queryKey: ['recipeComments', recipe.$id],
    queryFn: () => getRecipeComments(recipe.$id)
  })

  const latestComment = comments[0]
  const isOwner = user?.$id === recipe.userId

  const { data: commentAuthor } = useQuery({
    queryKey: ['user', latestComment?.userId],
    queryFn: () => getUserById(latestComment.userId),
    enabled: !!latestComment?.userId
  })
  
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
              {recipe.visibility === 'private' && isOwner && (
                <span className="px-3 py-1 bg-neutral-800 text-white text-xs font-bold rounded-full flex items-center gap-1">
                  <Lock size={12} />
                  Private
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

            {latestComment && commentAuthor && (
              <div className="mb-3 p-2 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={commentAuthor.avatarFileId ? getAvatarUrl(commentAuthor.avatarFileId) : `https://ui-avatars.com/api/?name=${commentAuthor.displayName}&background=FF5136&color=fff`}
                    alt={commentAuthor.displayName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-neutral-700">{commentAuthor.displayName}</span>
                  <span className="text-xs text-neutral-500">
                    {latestComment.$createdAt && formatDistanceToNow(new Date(latestComment.$createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-neutral-700 line-clamp-1 pl-7">{latestComment.content}</p>
              </div>
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

                {comments.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <MessageCircle size={16} className="text-accent" />
                    <span>{comments.length}</span>
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
