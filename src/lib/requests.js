import { databases, DATABASE_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'
import { createNotification } from './notifications'

const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID || 'requests'

export const createRequest = async (data) => {
  const payload = {
    foodItemId: data.foodItemId,
    requesterId: data.requesterId,
    ownerId: data.ownerId,
    message: data.message || '',
    status: 'pending',
    pickupOrDelivery: data.pickupOrDelivery,
    proposedTime: data.proposedTime || null
  }

  const response = await databases.createDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    ID.unique(),
    payload
  )
  
  // Create notification for owner
  await createNotification({
    userId: data.ownerId,
    type: 'request',
    payload: {
      requestId: response.$id,
      foodItemId: data.foodItemId
    }
  })
  
  return response
}

export const getRequestsByUser = async (userId) => {
  const queries = [
    Query.equal('requesterId', userId),
    Query.limit(50)
  ]
  return await databases.listDocuments(DATABASE_ID, REQUESTS_COLLECTION_ID, queries)
}

export const getRequestsByOwner = async (ownerId) => {
  const queries = [
    Query.equal('ownerId', ownerId),
    Query.limit(50)
  ]
  return await databases.listDocuments(DATABASE_ID, REQUESTS_COLLECTION_ID, queries)
}

export const getRequestsByFoodItem = async (foodItemId) => {
  const queries = [
    Query.equal('foodItemId', foodItemId),
    Query.limit(50)
  ]
  return await databases.listDocuments(DATABASE_ID, REQUESTS_COLLECTION_ID, queries)
}

export const updateRequestStatus = async (requestId, status, requestData = null) => {
  const response = await databases.updateDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    requestId,
    { status }
  )
  
  // Create notification for requester when accepted
  if (status === 'accepted' && requestData) {
    await createNotification({
      userId: requestData.requesterId,
      type: 'match',
      payload: {
        requestId: requestId,
        foodItemId: requestData.foodItemId
      }
    })
  }
  
  return response
}

export const getRequestById = async (requestId) => {
  return await databases.getDocument(DATABASE_ID, REQUESTS_COLLECTION_ID, requestId)
}
