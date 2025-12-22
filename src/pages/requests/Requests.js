import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRequestsByOwner, getRequestsByUser, updateRequestStatus } from '../../lib/requests'
import { getFoodItemById, updateFoodItem } from '../../lib/foodItems'
import { useAuth } from '../../context/AuthContext'
import { Check, X, Clock, Package, MessageSquare } from 'lucide-react'
import { toast } from 'react-toastify'
import Loader from '../../components/common/Loader'
import { Link, useNavigate } from 'react-router-dom'

const STATUS_COLORS = {
  pending: 'bg-warning/10 text-warning border-warning',
  accepted: 'bg-accent/10 text-accent border-accent',
  rejected: 'bg-error/10 text-error border-error',
  cancelled: 'bg-neutral-200 text-neutral-600 border-neutral-400',
  collected: 'bg-secondary/10 text-secondary border-secondary'
}

const Requests = () => {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('incoming')

  const { data: incomingRequests, isLoading: loadingIncoming } = useQuery({
    queryKey: ['requests', 'incoming', session.$id],
    queryFn: () => getRequestsByOwner(session.$id),
    enabled: !!session.$id
  })

  const { data: outgoingRequests, isLoading: loadingOutgoing } = useQuery({
    queryKey: ['requests', 'outgoing', session.$id],
    queryFn: () => getRequestsByUser(session.$id),
    enabled: !!session.$id
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status, foodItemId, requestData }) => {
      await updateRequestStatus(requestId, status, requestData)
      if (status === 'accepted') {
        await updateFoodItem(foodItemId, { status: 'reserved' })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['requests'])
      queryClient.invalidateQueries(['foodItems'])
      toast.success('Request updated successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update request')
    }
  })

  const handleAccept = (request) => {
    updateStatusMutation.mutate({
      requestId: request.$id,
      status: 'accepted',
      foodItemId: request.foodItemId,
      requestData: request
    })
  }

  const handleReject = (request) => {
    updateStatusMutation.mutate({
      requestId: request.$id,
      status: 'rejected',
      foodItemId: request.foodItemId
    })
  }

  const handleCollected = (request) => {
    updateStatusMutation.mutate({
      requestId: request.$id,
      status: 'collected',
      foodItemId: request.foodItemId
    })
  }

  const incoming = incomingRequests?.documents || []
  const outgoing = outgoingRequests?.documents || []
  const requests = activeTab === 'incoming' ? incoming : outgoing
  const isLoading = activeTab === 'incoming' ? loadingIncoming : loadingOutgoing

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 md:mb-6"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Requests
        </h1>
        <p className="text-sm md:text-base text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manage your food requests
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 md:mb-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all ${
            activeTab === 'incoming'
              ? 'bg-primary text-white'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <span className="hidden sm:inline">Incoming </span>({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex-1 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all ${
            activeTab === 'outgoing'
              ? 'bg-primary text-white'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <span className="hidden sm:inline">Outgoing </span>({outgoing.length})
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader size="lg" />
        </div>
      )}

      {/* Requests List */}
      {!isLoading && requests.length > 0 && (
        <div className="space-y-3 md:space-y-4">
          {requests.map((request) => (
            <RequestCard
              key={request.$id}
              request={request}
              isIncoming={activeTab === 'incoming'}
              onAccept={handleAccept}
              onReject={handleReject}
              onCollected={handleCollected}
              isUpdating={updateStatusMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 md:p-12 text-center"
        >
          <Package size={40} className="mx-auto text-neutral-300 mb-3 md:mb-4 md:w-12 md:h-12" />
          <h3 className="text-lg md:text-xl font-bold text-neutral-900 mb-2">No Requests</h3>
          <p className="text-sm md:text-base text-neutral-600">
            {activeTab === 'incoming' ? 'No incoming requests yet' : 'No outgoing requests yet'}
          </p>
        </motion.div>
      )}
    </div>
  )
}

const RequestCard = ({ request, isIncoming, onAccept, onReject, onCollected, isUpdating }) => {
  const navigate = useNavigate()
  const { data: foodItem, isError } = useQuery({
    queryKey: ['foodItem', request.foodItemId],
    queryFn: () => getFoodItemById(request.foodItemId),
    retry: false
  })

  if (isError || !foodItem) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-neutral-200 p-4 md:p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-2">
            <div className="flex-1">
              <Link to={`/food/${foodItem.$id}`} className="font-bold text-sm md:text-base text-neutral-900 hover:text-primary">
                {foodItem.title}
              </Link>
              <p className="text-xs md:text-sm text-neutral-600 mt-1">
                {request.pickupOrDelivery === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                {request.proposedTime && (
                  <span className="block sm:inline sm:ml-1">
                    • {new Date(request.proposedTime).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </p>
            </div>
            <span className={`px-2.5 md:px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${STATUS_COLORS[request.status]}`}>
              {request.status}
            </span>
          </div>

          {request.message && (
            <div className="p-2.5 md:p-3 bg-neutral-50 rounded-lg mb-3">
              <p className="text-xs md:text-sm text-neutral-700 line-clamp-3">{request.message}</p>
            </div>
          )}

          {/* Actions */}
          {isIncoming && request.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => onAccept(request)}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base bg-accent text-white rounded-lg md:rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                <Check size={16} className="md:w-[18px] md:h-[18px]" />
                Accept
              </button>
              <button
                onClick={() => onReject(request)}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base bg-error text-white rounded-lg md:rounded-xl hover:bg-error/90 transition-all disabled:opacity-50"
              >
                <X size={16} className="md:w-[18px] md:h-[18px]" />
                Reject
              </button>
            </div>
          )}

          {request.status === 'accepted' && (
            <div className="flex flex-col sm:flex-row gap-2">
              {isIncoming && (
                <button
                  onClick={() => onCollected(request)}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base bg-secondary text-white rounded-lg md:rounded-xl hover:bg-secondary/90 transition-all disabled:opacity-50"
                >
                  <Package size={16} className="md:w-[18px] md:h-[18px]" />
                  <span className="hidden sm:inline">Mark as </span>Collected
                </button>
              )}
              <button
                onClick={() => navigate(`/chat/${request.$id}`)}
                className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base bg-primary text-white rounded-lg md:rounded-xl hover:bg-primary/90 transition-all"
              >
                <MessageSquare size={16} className="md:w-[18px] md:h-[18px]" />
                Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Requests
