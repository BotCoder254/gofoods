import { databases, storage, DATABASE_ID, USERS_COLLECTION_ID, STORAGE_BUCKET_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'

export const createUser = async (userId, email, displayName) => {
  return await databases.createDocument(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    userId,
    {
      authId: userId,
      email,
      displayName,
      avatarFileId: '',
      bio: '',
      phone: '',
      location: null,
      role: 'user',
       isVerified: false,
      suspended: false
    }
  )
}

export const getUserById = async (userId) => {
  return await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId)
}

export const updateUser = async (userId, data) => {
  return await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, data)
}

export const uploadAvatar = async (file) => {
  const response = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file)
  return response.$id
}

export const getAvatarUrl = (fileId) => {
  if (!fileId) return null
  return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, 200, 200)
}

export const deleteAvatar = async (fileId) => {
  return await storage.deleteFile(STORAGE_BUCKET_ID, fileId)
}

export const searchUsers = async (searchTerm) => {
  if (!searchTerm) return []
  
  const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
    Query.search('displayName', searchTerm),
    Query.limit(20)
  ])
  return response.documents
}
