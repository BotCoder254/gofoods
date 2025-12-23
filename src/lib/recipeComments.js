import { databases, DATABASE_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'

export const RECIPE_COMMENTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_RECIPE_COMMENTS_COLLECTION_ID || 'recipecomments'

export const createRecipeComment = async (data) => {
  const payload = {
    recipeId: data.recipeId,
    userId: data.userId,
    content: data.content
  }

  return await databases.createDocument(
    DATABASE_ID,
    RECIPE_COMMENTS_COLLECTION_ID,
    ID.unique(),
    payload
  )
}

export const getRecipeComments = async (recipeId) => {
  const queries = [
    Query.equal('recipeId', recipeId),
    Query.limit(100)
  ]

  const response = await databases.listDocuments(DATABASE_ID, RECIPE_COMMENTS_COLLECTION_ID, queries)
  return response.documents
}

export const getRecipeCommentsCount = async (recipeId) => {
  const queries = [
    Query.equal('recipeId', recipeId),
    Query.limit(1)
  ]

  const response = await databases.listDocuments(DATABASE_ID, RECIPE_COMMENTS_COLLECTION_ID, queries)
  return response.total
}

export const deleteRecipeComment = async (commentId) => {
  return await databases.deleteDocument(DATABASE_ID, RECIPE_COMMENTS_COLLECTION_ID, commentId)
}
