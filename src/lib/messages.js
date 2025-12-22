import { databases, storage, DATABASE_ID, STORAGE_BUCKET_ID, Query, client } from '../config/appwrite'
import { createNotification } from './notifications'
import { getRequestById } from './requests'

const MESSAGES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID || 'messages'

export const createMessage = async (data) => {
  const payload = {
    requestId: data.requestId,
    senderId: data.senderId,
    text: data.text || '',
    attachments: JSON.stringify(data.attachments || []),
    readBy: JSON.stringify([data.senderId])
  }

  const response = await databases.createDocument(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    'unique()',
    payload
  )
  
  // Create notification for recipient
  try {
    const request = await getRequestById(data.requestId)
    const recipientId = data.senderId === request.requesterId ? request.ownerId : request.requesterId
    
    await createNotification({
      userId: recipientId,
      type: 'message',
      payload: {
        requestId: data.requestId,
        senderId: data.senderId
      }
    })
  } catch (error) {
    console.error('Error creating message notification:', error)
  }
  
  return response
}

export const getMessagesByRequest = async (requestId) => {
  const queries = [
    Query.equal('requestId', requestId),
    Query.limit(100)
  ]
  return await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, queries)
}

export const markMessageAsRead = async (messageId, userId) => {
  const message = await databases.getDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, messageId)
  const readBy = message.readBy ? JSON.parse(message.readBy) : []
  
  if (!readBy.includes(userId)) {
    readBy.push(userId)
    return await databases.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId,
      { readBy: JSON.stringify(readBy) }
    )
  }
  
  return message
}

export const uploadMessageAttachment = async (file) => {
  return await storage.createFile(STORAGE_BUCKET_ID, 'unique()', file)
}

export const getAttachmentUrl = (fileId) => {
  if (!fileId) return null
  return storage.getFileView(STORAGE_BUCKET_ID, fileId)
}

export const subscribeToMessages = (requestId, callback) => {
  return client.subscribe(
    `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`,
    (response) => {
      if (response.payload.requestId === requestId) {
        callback(response)
      }
    }
  )
}
