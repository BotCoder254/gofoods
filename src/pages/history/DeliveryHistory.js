import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { History, MapPin, Clock, Package, ChevronRight, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getRequestsByUser, getRequestsByOwner } from '../../lib/requests'
import { getFoodItemById } from '../../lib/foodItems'
import { getUserById } from '../../lib/users'
import { useAuth } from '../../context/AuthContext'
import Loader from '../../components/common/Loader'
import { formatDate } from '../../utils/helpers'

const DeliveryHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('received')

  const { data: receivedRequests, isLoading: loadingReceived } = useQuery({
    queryKey: ['receivedRequests', user?.$id],
    queryFn: () => getRequestsByUser(user.$id),
    enabled: !!user?.$id
  })

  const { data: providedRequests, isLoading: loadingProvided } = useQuery({
    queryKey: ['providedRequests', user?.$id],
    queryFn: () => getRequestsByOwner(user.$id),
    enabled: !!user?.$id
  })

  const completedReceived = receivedRequests?.documents?.filter(r => r.status === 'completed') || []
  const completedProvided = providedRequests?.documents?.filter(r => r.status === 'completed') || []

  const activeRequests = activeTab === 'received' ? completedReceived : completedProvided
  const isLoading = activeTab === 'received' ? loadingReceived : loadingProvided

  if (isLoading) {
    return <Loader fullScreen />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-3 bg-primary/10 rounded-xl">
          <History size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Delivery History
          </h1>
          <p className="text-neutral-600 text-sm md:text-base">View and replay your completed trips</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 bg-white rounded-xl p-2 shadow-md"
      >
        <button
          onClick={() => setActiveTab('received')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'received'
              ? 'bg-primary text-white shadow-lg'
              : 'text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Received ({completedReceived.length})
        </button>
        <button
          onClick={() => setActiveTab('provided')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'provided'
              ? 'bg-primary text-white shadow-lg'
              : 'text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          Provided ({completedProvided.length})
        </button>
      </motion.div>

      {activeRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-12 text-center"
        >
          <div className="p-4 bg-neutral-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <History size={40} className="text-neutral-400" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">No History Yet</h3>
          <p className="text-neutral-600">
            {activeTab === 'received'
              ? 'Your received deliveries will appear here'
              : 'Your provided deliveries will appear here'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {activeRequests.map((request, index) => (
            <RequestHistoryCard
              key={request.$id}
              request={request}
              index={index}
              isProvider={activeTab === 'provided'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const RequestHistoryCard = ({ request, index, isProvider }) => {
  const navigate = useNavigate()

  const { data: foodItem } = useQuery({
    queryKey: ['foodItem', request.foodItemId],
    queryFn: () => getFoodItemById(request.foodItemId),
    enabled: !!request.foodItemId
  })

  const { data: otherUser } = useQuery({
    queryKey: ['user', isProvider ? request.requesterId : request.ownerId],
    queryFn: () => getUserById(isProvider ? request.requesterId : request.ownerId),
    enabled: !!(isProvider ? request.requesterId : request.ownerId)
  })

  const hasRoutePath = request.routePath && request.routePath.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
    >
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-lg text-neutral-900 mb-1">
              {foodItem?.title || 'Loading...'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar size={14} />
              <span>Completed {formatDate(request.completedAt || request.$updatedAt)}</span>
            </div>
          </div>
          {request.rating && (
            <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 rounded-full">
              <span className="text-accent font-bold">{request.rating}</span>
              <span className="text-accent text-sm">★</span>
            </div>
          )}
        </div>

        {otherUser && (
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg mb-4">
            <img
              src={`https://ui-avatars.com/api/?name=${otherUser.displayName}&background=FF5136&color=fff`}
              alt={otherUser.displayName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="font-medium text-neutral-900">{otherUser.displayName}</div>
              <div className="text-xs text-neutral-600">
                {isProvider ? 'Requester' : 'Provider'}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package size={16} className="text-primary" />
            </div>
            <div>
              <div className="text-xs text-neutral-600">Type</div>
              <div className="font-medium text-neutral-900 capitalize">{request.pickupOrDelivery}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Clock size={16} className="text-secondary" />
            </div>
            <div>
              <div className="text-xs text-neutral-600">Status</div>
              <div className="font-medium text-accent">Completed</div>
            </div>
          </div>
        </div>

        {request.feedback && (
          <div className="p-3 bg-neutral-50 rounded-lg mb-4">
            <div className="text-xs text-neutral-600 mb-1">Feedback</div>
            <p className="text-sm text-neutral-900">{request.feedback}</p>
          </div>
        )}

        <button
          onClick={() => navigate(`/history/route/${request.$id}`)}
          disabled={!hasRoutePath}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
            hasRoutePath
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin size={18} />
            <span>{hasRoutePath ? 'View Route Replay' : 'Route Not Available'}</span>
          </div>
          {hasRoutePath && <ChevronRight size={18} />}
        </button>
      </div>
    </motion.div>
  )
}

export default DeliveryHistory
