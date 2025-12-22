import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, X, Check, CheckCheck } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessagesByRequest, createMessage, uploadMessageAttachment, subscribeToMessages, markMessageAsRead, getAttachmentUrl } from '../../lib/messages'
import { getRequestById } from '../../lib/requests'
import { getFoodItemById } from '../../lib/foodItems'
import { getUserById, getAvatarUrl } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import Loader from '../../components/common/Loader'

const Chat = () => {
  const { requestId } = useParams()
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [messageText, setMessageText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [showNewMessages, setShowNewMessages] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [uploading, setUploading] = useState(false)

  const { data: request } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequestById(requestId)
  })

  const { data: foodItem } = useQuery({
    queryKey: ['foodItem', request?.foodItemId],
    queryFn: () => getFoodItemById(request.foodItemId),
    enabled: !!request?.foodItemId
  })

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', requestId],
    queryFn: () => getMessagesByRequest(requestId)
  })

  const { data: otherUser } = useQuery({
    queryKey: ['user', request?.requesterId === session.$id ? request?.ownerId : request?.requesterId],
    queryFn: () => getUserById(request.requesterId === session.$id ? request.ownerId : request.requesterId),
    enabled: !!request
  })

  // Mark messages as read
  useEffect(() => {
    if (messages?.documents && session.$id) {
      messages.documents.forEach(msg => {
        if (msg.senderId !== session.$id && !msg.readBy.includes(session.$id)) {
          markMessageAsRead(msg.$id, session.$id)
        }
      })
    }
  }, [messages, session.$id])

  // Subscribe to realtime messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(requestId, () => {
      queryClient.invalidateQueries(['messages', requestId])
      if (!isAtBottom) {
        setShowNewMessages(true)
      }
    })
    return () => unsubscribe()
  }, [requestId, queryClient, isAtBottom])

  // Scroll behavior
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isAtBottom])

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      setIsAtBottom(atBottom)
      if (atBottom) {
        setShowNewMessages(false)
      }
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowNewMessages(false)
  }

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      setUploading(true)
      const uploadedAttachments = []
      for (const file of attachments) {
        const uploaded = await uploadMessageAttachment(file)
        uploadedAttachments.push(uploaded.$id)
      }

      return await createMessage({
        requestId,
        senderId: session.$id,
        text: data.text,
        attachments: uploadedAttachments
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', requestId])
      setMessageText('')
      setAttachments([])
      setIsAtBottom(true)
      setUploading(false)
    },
    onError: (error) => {
      console.error('Message send error:', error)
      toast.error('Failed to send message')
      setUploading(false)
    }
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!messageText.trim() && attachments.length === 0) return
    sendMessageMutation.mutate({ text: messageText })
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + attachments.length > 5) {
      toast.error('Maximum 5 attachments allowed')
      return
    }
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  if (isLoading) return <Loader fullScreen />

  const messagesList = messages?.documents || []

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-180px)] max-w-4xl mx-auto bg-white rounded-t-2xl lg:rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate('/requests')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        {otherUser && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={otherUser.avatarFileId ? getAvatarUrl(otherUser.avatarFileId) : `https://ui-avatars.com/api/?name=${otherUser.displayName}&background=FF5136&color=fff`}
              alt={otherUser.displayName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-neutral-900 truncate">{otherUser.displayName}</div>
              {foodItem && (
                <div className="text-sm text-neutral-600 truncate">{foodItem.title}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50"
      >
        <AnimatePresence>
          {messagesList.map((message, index) => (
            <MessageBubble
              key={message.$id}
              message={message}
              isOwn={message.senderId === session.$id}
              index={index}
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* New Messages Indicator */}
      {showNewMessages && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={scrollToBottom}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary text-white rounded-full shadow-lg text-sm font-medium"
        >
          New messages ↓
        </motion.button>
      )}

      {/* Input */}
      <div className="bg-white border-t border-neutral-200 p-3 lg:p-4 flex-shrink-0 pb-safe">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <ImageIcon size={20} className="text-neutral-400" />
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <label className="p-2 lg:p-2.5 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors flex-shrink-0">
            <Paperclip size={20} className="text-neutral-600" />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>

          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            disabled={uploading}
            className="flex-1 px-3 py-2.5 lg:px-4 lg:py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none text-sm lg:text-base disabled:bg-neutral-100"
          />

          <button
            type="submit"
            disabled={uploading || (!messageText.trim() && attachments.length === 0)}
            className="p-2.5 lg:p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

const MessageBubble = ({ message, isOwn, index }) => {
  const hasAttachments = message.attachments && message.attachments.length > 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-3 py-2 lg:px-4 lg:py-3 ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white text-neutral-900 rounded-bl-sm border border-neutral-200'
        }`}
      >
        {hasAttachments && (
          <div className={`grid gap-1 mb-2 ${
            message.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          }`}>
            {message.attachments.map((fileId, idx) => (
              <img
                key={idx}
                src={getAttachmentUrl(fileId)}
                alt="Attachment"
                className="w-full max-w-[200px] h-auto max-h-[200px] object-cover rounded-lg"
              />
            ))}
          </div>
        )}
        {message.text && <p className="text-sm lg:text-base break-words">{message.text}</p>}
        <div className={`flex items-center gap-1 text-xs mt-1 ${
          isOwn ? 'text-white/70 justify-end' : 'text-neutral-500'
        }`}>
          <span>{new Date(message.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isOwn && (
            message.readBy.length > 1 ? (
              <CheckCheck size={14} className="text-accent" />
            ) : (
              <Check size={14} />
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Chat
