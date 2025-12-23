import { databases, storage, DATABASE_ID, STORAGE_BUCKET_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'

export const RECIPES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_RECIPES_COLLECTION_ID || 'recipes'

export const createRecipe = async (data) => {
  if (!data.userId) {
    throw new Error('userId is required')
  }

  const payload = {
    userId: data.userId,
    title: data.title,
    description: data.description || '',
    ingredients: data.ingredients || '[]',
    steps: data.steps || '[]',
    cookTimeMinutes: data.cookTimeMinutes,
    servings: data.servings || null,
    imageId: data.imageId || null,
    linkedFoodItemId: data.linkedFoodItemId || null
  }

  return await databases.createDocument(
    DATABASE_ID,
    RECIPES_COLLECTION_ID,
    ID.unique(),
    payload
  )
}

export const getRecipes = async (filters = {}) => {
  const queries = [Query.limit(50)]
  
  if (filters.userId) {
    queries.push(Query.equal('userId', filters.userId))
  }

  if (filters.cookTimeMax) {
    queries.push(Query.lessThanEqual('cookTimeMinutes', filters.cookTimeMax))
  }

  const response = await databases.listDocuments(DATABASE_ID, RECIPES_COLLECTION_ID, queries)
  
  return {
    ...response,
    documents: response.documents.map(recipe => ({
      ...recipe,
      ingredients: typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients || '[]') : (recipe.ingredients || []),
      steps: typeof recipe.steps === 'string' ? JSON.parse(recipe.steps || '[]') : (recipe.steps || [])
    }))
  }
}

export const getRecipeById = async (recipeId) => {
  const recipe = await databases.getDocument(DATABASE_ID, RECIPES_COLLECTION_ID, recipeId)
  
  return {
    ...recipe,
    ingredients: typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients || '[]') : (recipe.ingredients || []),
    steps: typeof recipe.steps === 'string' ? JSON.parse(recipe.steps || '[]') : (recipe.steps || [])
  }
}

export const updateRecipe = async (recipeId, data) => {
  return await databases.updateDocument(
    DATABASE_ID,
    RECIPES_COLLECTION_ID,
    recipeId,
    data
  )
}

export const deleteRecipe = async (recipeId) => {
  return await databases.deleteDocument(DATABASE_ID, RECIPES_COLLECTION_ID, recipeId)
}

export const uploadRecipeImage = async (file) => {
  return await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file)
}

export const getRecipeImageUrl = (fileId, width = 400, height = 400) => {
  if (!fileId) return null
  return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, width, height)
}

export const searchRecipes = async (searchTerm) => {
  if (!searchTerm) return []
  
  const queries = [Query.limit(100)]
  
  const response = await databases.listDocuments(DATABASE_ID, RECIPES_COLLECTION_ID, queries)
  
  const filtered = response.documents.filter(recipe => 
    recipe.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return filtered.slice(0, 20).map(recipe => ({
    ...recipe,
    ingredients: typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients || '[]') : (recipe.ingredients || []),
    steps: typeof recipe.steps === 'string' ? JSON.parse(recipe.steps || '[]') : (recipe.steps || [])
  }))
}
