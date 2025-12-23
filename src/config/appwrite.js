import { Client, Account, Databases, Storage, Query } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || '')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID || ''
export const USERS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_USERS_COLLECTION_ID || 'users'
export const POSTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_POSTS_COLLECTION_ID || 'fooditems'
export const FOODS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_FOODS_COLLECTION_ID || 'fooditems'
export const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID || 'requests'
export const MESSAGES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID || 'messages'
export const BOOKMARKS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_BOOKMARKS_COLLECTION_ID || 'bookmarks'
export const NOTIFICATIONS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications'
export const RECIPES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_RECIPES_COLLECTION_ID || 'recipes'
export const RECIPE_COMMENTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_RECIPE_COMMENTS_COLLECTION_ID || 'recipecomments'
export const STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID || ''

export { Query, client }
