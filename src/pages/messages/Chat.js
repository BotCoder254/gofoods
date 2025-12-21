import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Send, Paperclip, Image as ImageIcon, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMessagesByRequest, createMessage, uploadMessageAttachment, subscribeToMessages, markMessageAsRead } from '../../lib/messages'
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
  const [messageText, setMessageText] = useState('')
  const [attachments, setAttachments] = useState([])

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
  }, [messages])

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
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
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send message')
    }
  })

  const handleSend = (e) => {
    e.preventDefault()
    if (!messageText.trim() && attachments.length === 0) return
    sendMessageMutation.mutate({ text: messageText })
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
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
            />
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-neutral-200 p-4">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative flex-shrink-0">
                <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <ImageIcon size={24} className="text-neutral-400" />
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 p-1 bg-error text-white rounded-full"
                >
                  <X size={14} />
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
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
          />

          <button
            type="submit"
            disabled={sendMessageMutation.isPending || (!messageText.trim() && attachments.length === 0)}
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

const MessageBubble = ({ message, isOwn, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-primary text-white rounded-br-sm'
            : 'bg-white text-neutral-900 rounded-bl-sm border border-neutral-200'
        }`}
      >
        {message.text && <p className="text-sm">{message.text}</p>}
        <div className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-neutral-500'}`}>
          {new Date(message.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

export default Chat
