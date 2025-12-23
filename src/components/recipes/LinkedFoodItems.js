import React from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getFoodItems } from '../../lib/foodItems'
import FoodCard from '../posts/FoodCard'

const LinkedFoodItems = ({ recipeId, linkedFoodItemId }) => {
  const { data: foodItems } = useQuery({
    queryKey: ['linkedFoodItems', recipeId],
    queryFn: () => getFoodItems(),
    enabled: !!recipeId
  })

  const relatedItems = foodItems?.documents?.filter(item => 
    item.$id === linkedFoodItemId || item.title?.toLowerCase().includes('recipe')
  ).slice(0, 3) || []

  if (relatedItems.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <ShoppingBag size={24} className="text-primary" />
        Available Nearby
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedItems.map((item, index) => (
          <FoodCard key={item.$id} item={item} index={index} />
        ))}
      </div>
    </div>
  )
}

export default LinkedFoodItems
