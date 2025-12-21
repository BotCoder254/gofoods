import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MessageCircle, Package, CheckCircle, X, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  subscribeToNotifications 
} from '../../lib/notifications'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-toastify'

const NotificationDropdown = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.$id],
    queryFn: () => getUserNotifications(user.$id),
    enabled: !!user?.$id,
    refetchInterval: 30000
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user.$id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications'])
      toast.success('All notifications marked as read')
    }
  })

  useEffect(() => {
    if (!user?.$id) return

    const unsubscribe = subscribeToNotifications(user.$id, (notification) => {
      queryClient.invalidateQueries(['notifications'])
      
      const messages = {
        request: 'New request for your food item',
        message: 'New message received',
        match: 'Your request was accepted!',
        system: 'System notification'
      }
      
      toast.info(messages[notification.type] || 'New notification', {
        icon: <Bell className="text-primary" />
      })
    })

    return () => unsubscribe()
  }, [user?.$id, queryClient])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.$id)
    }

    const { type, payload } = notification
    
    if (type === 'request' && payload?.requestId) {
      navigate('/requests')
    } else if (type === 'message' && payload?.requestId) {
      navigate(`/chat/${payload.requestId}`)
    } else if (type === 'match' && payload?.requestId) {
      navigate('/requests')
    }

    setIsOpen(false)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'request':
        return <Package size={20} className="text-primary" />
      case 'message':
        return <MessageCircle size={20} className="text-secondary" />
      case 'match':
        return <CheckCircle size={20} className="text-accent" />
      default:
        return <Bell size={20} className="text-neutral-600" />
    }
  }

  const getNotificationText = (notification) => {
    const { type, payload } = notification
    
    switch (type) {
      case 'request':
        return 'Someone requested your food item'
      case 'message':
        return 'New message in your conversation'
      case 'match':
        return 'Your request was accepted!'
      case 'system':
        return payload?.message || 'System notification'
      default:
        return 'New notification'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
      >
        <Bell size={24} className="text-neutral-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Full Screen */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-white z-50 overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Notifications
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {unreadCount > 0 && (
                <div className="p-4 border-b border-neutral-200">
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-primary font-medium text-sm flex items-center gap-2"
                  >
                    <Check size={16} />
                    Mark all as read
                  </button>
                </div>
              )}

              <div className="divide-y divide-neutral-200">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <Bell size={48} className="mx-auto mb-4 text-neutral-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.$id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer active:bg-neutral-50 transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Desktop Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="hidden md:block absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden z-50"
            >
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <Bell size={48} className="mx-auto mb-4 text-neutral-300" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.$id}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
                            {getNotificationText(notification)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDistanceToNow(new Date(notification.$createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationDropdown
