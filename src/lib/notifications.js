import { databases, client } from '../config/appwrite'
import { DATABASE_ID, NOTIFICATIONS_COLLECTION_ID } from '../config/appwrite'
import { Query } from 'appwrite'

export const createNotification = async (notificationData) => {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      'unique()',
      {
        userId: notificationData.userId,
        type: notificationData.type,
        payload: notificationData.payload || {},
        read: false
      }
    )
    return response
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

export const getUserNotifications = async (userId, limit = 50) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit)
      ]
    )
    return response.documents
  } catch (error) {
    console.error('Error fetching notifications:', error)
    throw error
  }
}

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await databases.updateDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId,
      { read: true }
    )
    return response
  } catch (error) {
    console.error('Error marking notification as read:', error)
    throw error
  }
}

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifications = await getUserNotifications(userId)
    const unreadNotifications = notifications.filter(n => !n.read)
    
    await Promise.all(
      unreadNotifications.map(n => markNotificationAsRead(n.$id))
    )
    
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    throw error
  }
}

export const deleteNotification = async (notificationId) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      notificationId
    )
    return true
  } catch (error) {
    console.error('Error deleting notification:', error)
    throw error
  }
}

export const subscribeToNotifications = (userId, callback) => {
  const channel = `databases.${DATABASE_ID}.collections.${NOTIFICATIONS_COLLECTION_ID}.documents`
  
  return client.subscribe(channel, (response) => {
    if (response.events.includes('databases.*.collections.*.documents.*')) {
      const notification = response.payload
      if (notification.userId === userId) {
        callback(notification)
      }
    }
  })
}
