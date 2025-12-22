import { databases, storage, DATABASE_ID, FOODS_COLLECTION_ID, STORAGE_BUCKET_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'

export const createFoodItem = async (data) => {
  console.log('Creating food item with data:', data)
  
  if (!data.ownerId) {
    throw new Error('ownerId is required but was not provided')
  }

  const payload = {
    ownerId: data.ownerId,
    title: data.title,
    description: data.description || '',
    images: data.images || [],
    foodType: data.foodType,
    tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : '[]',
    quantity: data.quantity,
    price: data.price || 0,
    isDonation: data.isDonation,
    pickup: data.pickup,
    delivery: data.delivery,
    pickupAddress: data.pickupAddress ? JSON.stringify(data.pickupAddress) : null,
    deliveryRadiusKm: data.deliveryRadiusKm || 0,
    availableFrom: data.availableFrom || new Date().toISOString(),
    availableUntil: data.availableUntil || null,
    status: 'active',
    editCount: 0
  }

  console.log('Payload to send:', payload)

  return await databases.createDocument(
    DATABASE_ID,
    FOODS_COLLECTION_ID,
    ID.unique(),
    payload
  )
}

export const getFoodItems = async (filters = {}) => {
  const queries = [Query.equal('status', 'active'), Query.limit(50)]
  
  if (filters.foodType) {
    queries.push(Query.equal('foodType', filters.foodType))
  }
  
  if (filters.isDonation !== undefined) {
    queries.push(Query.equal('isDonation', filters.isDonation))
  }

  const response = await databases.listDocuments(DATABASE_ID, FOODS_COLLECTION_ID, queries)
  
  return {
    ...response,
    documents: response.documents.map(item => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []),
      tags: typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : (item.tags || []),
      pickupAddress: typeof item.pickupAddress === 'string' ? JSON.parse(item.pickupAddress || 'null') : item.pickupAddress
    }))
  }
}

export const getFoodItemById = async (itemId) => {
  const item = await databases.getDocument(DATABASE_ID, FOODS_COLLECTION_ID, itemId)
  return {
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []),
    tags: typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : (item.tags || []),
    pickupAddress: typeof item.pickupAddress === 'string' ? JSON.parse(item.pickupAddress || 'null') : item.pickupAddress
  }
}

export const updateFoodItem = async (itemId, data) => {
  return await databases.updateDocument(
    DATABASE_ID,
    FOODS_COLLECTION_ID,
    itemId,
    data
  )
}

export const deleteFoodItem = async (itemId) => {
  return await databases.deleteDocument(DATABASE_ID, FOODS_COLLECTION_ID, itemId)
}

export const uploadFoodImage = async (file) => {
  return await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file)
}

export const getFoodImageUrl = (fileId, width = 400, height = 400) => {
  if (!fileId) return null
  return storage.getFilePreview(STORAGE_BUCKET_ID, fileId, width, height)
}

export const parseFoodItemImages = (item) => {
  if (!item) return item
  
  return {
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || [])
  }
}

export const deleteFoodImage = async (fileId) => {
  return await storage.deleteFile(STORAGE_BUCKET_ID, fileId)
}

export const searchFoodItems = async (searchTerm) => {
  if (!searchTerm) return []
  
  // Get all active items and filter client-side since fulltext index may not be available
  const queries = [
    Query.equal('status', 'active'),
    Query.limit(100)
  ]
  
  const response = await databases.listDocuments(DATABASE_ID, FOODS_COLLECTION_ID, queries)
  
  // Filter by search term client-side
  const filtered = response.documents.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return filtered.slice(0, 20).map(item => ({
    ...item,
    images: typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []),
    tags: typeof item.tags === 'string' ? JSON.parse(item.tags || '[]') : (item.tags || []),
    pickupAddress: typeof item.pickupAddress === 'string' ? JSON.parse(item.pickupAddress || 'null') : item.pickupAddress
  }))
}
