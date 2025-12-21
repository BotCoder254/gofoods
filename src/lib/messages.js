import { databases, storage, DATABASE_ID, STORAGE_BUCKET_ID, Query, client } from '../config/appwrite'
import { ID } from 'appwrite'

const MESSAGES_COLLECTION_ID = process.env.REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID || 'messages'

export const createMessage = async (data) => {
  const payload = {
    requestId: data.requestId,
    senderId: data.senderId,
    text: data.text || '',
    attachments: data.attachments || [],
    readBy: [data.senderId]
  }

  return await databases.createDocument(
    DATABASE_ID,
    MESSAGES_COLLECTION_ID,
    ID.unique(),
    payload
  )
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
  const readBy = message.readBy || []
  
  if (!readBy.includes(userId)) {
    readBy.push(userId)
    return await databases.updateDocument(
      DATABASE_ID,
      MESSAGES_COLLECTION_ID,
      messageId,
      { readBy }
    )
  }
  
  return message
}

export const uploadMessageAttachment = async (file) => {
  return await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file)
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
