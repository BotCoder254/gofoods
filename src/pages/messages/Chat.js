import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, X, Check, CheckCheck, Loader2 } from 'lucide-react'
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
  const typingTimeoutRef = useRef(null)
  const [messageText, setMessageText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

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

  useEffect(() => {
    const unsubscribe = subscribeToMessages(requestId, () => {
      queryClient.invalidateQueries(['messages', requestId])
    })
    return () => unsubscribe()
  }, [requestId, queryClient])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    
    // Mark messages as read
    if (messages?.documents) {
      messages.documents.forEach(msg => {
        if (msg.senderId !== session.$id) {
          const readBy = msg.readBy ? JSON.parse(msg.readBy) : []
          if (!readBy.includes(session.$id)) {
            markMessageAsRead(msg.$id, session.$id).catch(err => 
              console.error('Error marking message as read:', err)
            )
          }
        }
      })
    }
  }, [messages, session.$id])

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const uploadedAttachments = []
      setUploadProgress(0)
      
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i]
        const uploaded = await uploadMessageAttachment(file)
        uploadedAttachments.push(uploaded.$id)
        setUploadProgress(((i + 1) / attachments.length) * 100)
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
      setUploadProgress(0)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message')
      setUploadProgress(0)
    }
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!messageText.trim() && attachments.length === 0) return
    sendMessageMutation.mutate({ text: messageText })
    setIsTyping(false)
  }

  const handleTyping = (e) => {
    setMessageText(e.target.value)
    
    if (!isTyping) {
      setIsTyping(true)
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
    }, 2000)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each file must be less than 5MB')
        return
      }
    })
    
    setAttachments([...attachments, ...files])
  }

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  if (isLoading) return <Loader fullScreen />

  const messagesList = messages?.documents || []

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/requests')}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        {otherUser && (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={otherUser.avatarFileId ? getAvatarUrl(otherUser.avatarFileId) : `https://ui-avatars.com/api/?name=${otherUser.displayName}&background=FF5136&color=fff`}
              alt={otherUser.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <div className="font-bold text-neutral-900">{otherUser.displayName}</div>
              {foodItem && (
                <div className="text-sm text-neutral-600">{foodItem.title}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        <AnimatePresence>
          {messagesList.map((message, index) => (
            <MessageBubble
              key={message.$id}
              message={message}
              isOwn={message.senderId === session.$id}
              index={index}
              currentUserId={session.$id}
            />
          ))}
        </AnimatePresence>
        
        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex justify-start"
          >
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 border border-neutral-200">
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  className="w-2 h-2 bg-neutral-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-neutral-200 p-4">
        {/* Upload Progress */}
        {sendMessageMutation.isPending && uploadProgress > 0 && attachments.length > 0 && (
          <div className="mb-3 p-3 bg-primary/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700">Uploading attachments...</span>
              <span className="text-sm font-bold text-primary">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
        )}
        
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-neutral-400" />
                  )}
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 p-0.5 bg-error text-white rounded-full"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="p-2 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors">
            <Paperclip size={20} className="text-neutral-600" />
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          <input
            type="text"
            value={messageText}
            onChange={handleTyping}
            placeholder="Type a message..."
            disabled={sendMessageMutation.isPending}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none disabled:bg-neutral-50 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={sendMessageMutation.isPending || (!messageText.trim() && attachments.length === 0)}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

const MessageBubble = ({ message, isOwn, index, currentUserId }) => {
  const attachments = message.attachments ? JSON.parse(message.attachments) : []
  const readBy = message.readBy ? JSON.parse(message.readBy) : []
  const isRead = readBy.length > 1
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white text-neutral-900 rounded-bl-sm border border-neutral-200'
        }`}
      >
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-2 space-y-2">
            {attachments.map((attachmentId, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden">
                <img
                  src={getAttachmentUrl(attachmentId)}
                  alt="Attachment"
                  className="max-w-full h-auto max-h-60 rounded-lg"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Text */}
        {message.text && <p className="text-sm break-words">{message.text}</p>}
        
        {/* Time and Read Status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-xs ${isOwn ? 'text-white/70' : 'text-neutral-500'}`}>
            {new Date(message.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <span className="text-white/70">
              {isRead ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Chat
