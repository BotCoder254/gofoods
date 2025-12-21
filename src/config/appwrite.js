import { Client, Account, Databases, Storage, Query } from 'appwrite'

const client = new Client()
  .setEndpoint(process.env.REACT_APP_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.REACT_APP_APPWRITE_PROJECT_ID || '6947f856001edb6bfaa8')

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export const DATABASE_ID = process.env.REACT_APP_APPWRITE_DATABASE_ID || '6948033f000f16ac92ea'
export const USERS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_USERS_COLLECTION_ID || 'users'
export const POSTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_POSTS_COLLECTION_ID || 'fooditems'
export const FOODS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_FOODS_COLLECTION_ID || 'fooditems'
export const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID || ''
export const MESSAGES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID || ''
export const BOOKMARKS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_BOOKMARKS_COLLECTION_ID || ''
export const STORAGE_BUCKET_ID = process.env.REACT_APP_APPWRITE_STORAGE_BUCKET_ID || '69485c9500099ea47262'

export { Query, client }
