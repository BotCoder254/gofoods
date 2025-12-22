import { databases, DATABASE_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'

const BOOKMARKS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_BOOKMARKS_COLLECTION_ID || 'bookmarks'

export const createBookmark = async (userId, foodItemId) => {
  return await databases.createDocument(
    DATABASE_ID,
    BOOKMARKS_COLLECTION_ID,
    ID.unique(),
    {
      userId,
      foodItemId
    }
  )
}

export const getBookmarksByUser = async (userId) => {
  const queries = [
    Query.equal('userId', userId),
    Query.limit(100)
  ]
  return await databases.listDocuments(DATABASE_ID, BOOKMARKS_COLLECTION_ID, queries)
}

export const checkBookmark = async (userId, foodItemId) => {
  const queries = [
    Query.equal('userId', userId),
    Query.equal('foodItemId', foodItemId),
    Query.limit(1)
  ]
  const result = await databases.listDocuments(DATABASE_ID, BOOKMARKS_COLLECTION_ID, queries)
  return result.documents.length > 0 ? result.documents[0] : null
}

export const deleteBookmark = async (bookmarkId) => {
  return await databases.deleteDocument(DATABASE_ID, BOOKMARKS_COLLECTION_ID, bookmarkId)
}

export const deleteBookmarksByFoodItem = async (foodItemId) => {
  const queries = [
    Query.equal('foodItemId', foodItemId),
    Query.limit(100)
  ]
  const result = await databases.listDocuments(DATABASE_ID, BOOKMARKS_COLLECTION_ID, queries)
  
  const deletePromises = result.documents.map(bookmark => 
    databases.deleteDocument(DATABASE_ID, BOOKMARKS_COLLECTION_ID, bookmark.$id)
  )
  
  return await Promise.all(deletePromises)
}
