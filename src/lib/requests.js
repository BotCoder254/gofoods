import { databases, DATABASE_ID, Query } from '../config/appwrite'
import { ID } from 'appwrite'
import { createNotification } from './notifications'

const REQUESTS_COLLECTION_ID = process.env.REACT_APP_APPWRITE_REQUESTS_COLLECTION_ID || 'requests'

const generateShareToken = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

export const createRequest = async (data) => {
  const payload = {
    foodItemId: data.foodItemId,
    requesterId: data.requesterId,
    ownerId: data.ownerId,
    message: data.message || '',
    status: 'pending',
    pickupOrDelivery: data.pickupOrDelivery,
    proposedTime: data.proposedTime || null,
    rating: null,
    feedback: null,
    confirmedAt: null,
    handoffPoint: null,
    requesterLocation: null,
    ownerLocation: null,
    shareEnabled: false,
    shareToken: null,
    routePath: '[]',
    completedAt: null
  }
  
  // Override with actual values if provided
  if (data.handoffPoint) {
    payload.handoffPoint = typeof data.handoffPoint === 'string' ? data.handoffPoint : JSON.stringify(data.handoffPoint)
  }
  if (data.requesterLocation) {
    payload.requesterLocation = JSON.stringify(data.requesterLocation)
  }
  if (data.ownerLocation) {
    payload.ownerLocation = JSON.stringify(data.ownerLocation)
  }

  const response = await databases.createDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    ID.unique(),
    payload
  )
  
  // Create notification for owner
  try {
    await createNotification({
      userId: data.ownerId,
      type: 'request',
      payload: {
        requestId: response.$id,
        foodItemId: data.foodItemId
      }
    })
  } catch (error) {
    console.error('Error creating notification:', error)
  }
  
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
  const updateData = { status }
  
  // Include additional data if provided
  if (requestData?.handoffPoint) {
    updateData.handoffPoint = typeof requestData.handoffPoint === 'string' ? requestData.handoffPoint : JSON.stringify(requestData.handoffPoint)
  }
  if (requestData?.confirmedAt) {
    updateData.confirmedAt = requestData.confirmedAt
  }
  if (requestData?.rating) {
    updateData.rating = requestData.rating
  }
  if (requestData?.feedback) {
    updateData.feedback = requestData.feedback
  }
  
  const response = await databases.updateDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    requestId,
    updateData
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

export const updateRequestLocation = async (requestId, location, locationType = 'requester') => {
  try {
    const field = locationType === 'requester' ? 'requesterLocation' : 'ownerLocation'
    return await databases.updateDocument(
      DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      requestId,
      { [field]: JSON.stringify(location) }
    )
  } catch (error) {
    console.error('Error updating location:', error)
    // Silently fail if attribute doesn't exist
    return null
  }
}

export const updateHandoffPoint = async (requestId, handoffPoint) => {
  try {
    const request = await databases.getDocument(DATABASE_ID, REQUESTS_COLLECTION_ID, requestId)
    
    // Store as string since Appwrite attribute is string type
    const handoffPointStr = typeof handoffPoint === 'string' ? handoffPoint : JSON.stringify(handoffPoint)
    
    const response = await databases.updateDocument(
      DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      requestId,
      { handoffPoint: handoffPointStr }
    )
    
    // Notify both parties
    try {
      await createNotification({
        userId: request.requesterId,
        type: 'system',
        payload: {
          requestId: requestId,
          message: 'Handoff point has been updated'
        }
      })
      
      await createNotification({
        userId: request.ownerId,
        type: 'system',
        payload: {
          requestId: requestId,
          message: 'Handoff point has been updated'
        }
      })
    } catch (notifError) {
      console.error('Error sending notifications:', notifError)
    }
    
    return response
  } catch (error) {
    console.error('Error updating handoff point:', error)
    throw error
  }
}

export const confirmCompletion = async (requestId, data = {}) => {
  try {
    // First get the current request to preserve required fields
    const currentRequest = await databases.getDocument(DATABASE_ID, REQUESTS_COLLECTION_ID, requestId)
    
    const updateData = {
      status: 'collected',
      completedAt: new Date().toISOString(),
      shareEnabled: currentRequest.shareEnabled || false,
      routePath: currentRequest.routePath || '[]'
    }
    
    if (data.rating) updateData.rating = data.rating
    if (data.feedback) updateData.feedback = data.feedback
    if (data.confirmedAt) updateData.confirmedAt = data.confirmedAt
    
    return await databases.updateDocument(
      DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      requestId,
      updateData
    )
  } catch (error) {
    console.error('Error confirming completion:', error)
    throw error
  }
}

export const enableTripSharing = async (requestId) => {
  const shareToken = generateShareToken()
  return await databases.updateDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    requestId,
    { shareEnabled: true, shareToken }
  )
}

export const disableTripSharing = async (requestId) => {
  return await databases.updateDocument(
    DATABASE_ID,
    REQUESTS_COLLECTION_ID,
    requestId,
    { shareEnabled: false, shareToken: null }
  )
}

export const getSharedTrip = async (shareToken) => {
  const queries = [
    Query.equal('shareToken', shareToken),
    Query.equal('shareEnabled', true),
    Query.limit(1)
  ]
  const response = await databases.listDocuments(DATABASE_ID, REQUESTS_COLLECTION_ID, queries)
  return response.documents[0] || null
}

export const saveRouteSnapshot = async (requestId, location) => {
  try {
    const request = await databases.getDocument(DATABASE_ID, REQUESTS_COLLECTION_ID, requestId)
    const currentPath = request.routePath ? 
      (typeof request.routePath === 'string' ? JSON.parse(request.routePath) : request.routePath) 
      : []
    
    const newPath = [...currentPath, { lat: location.lat, lng: location.lng, timestamp: Date.now() }]
    
    return await databases.updateDocument(
      DATABASE_ID,
      REQUESTS_COLLECTION_ID,
      requestId,
      { routePath: JSON.stringify(newPath) }
    )
  } catch (error) {
    console.error('Error saving route snapshot:', error)
    return null
  }
}
