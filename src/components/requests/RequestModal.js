import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send, Home, Truck, Calendar, MessageSquare } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRequest } from '../../lib/requests'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { Button } from '../common/FormElements'

const RequestModal = ({ isOpen, onClose, foodItem }) => {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    pickupOrDelivery: 'pickup',
    proposedTime: '',
    message: ''
  })

  const requestMutation = useMutation({
    mutationFn: async (data) => {
      return await createRequest({
        foodItemId: foodItem.$id,
        requesterId: session.$id,
        ownerId: foodItem.ownerId,
        ...data
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['requests'])
      queryClient.invalidateQueries(['foodItem', foodItem.$id])
      toast.success('Request sent successfully!')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send request')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    requestMutation.mutate(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Request Food
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-neutral-50 rounded-xl">
            <h3 className="font-bold text-neutral-900 mb-1">{foodItem.title}</h3>
            <p className="text-sm text-primary font-bold">
              {foodItem.isDonation ? 'Free' : `$${foodItem.price?.toFixed(2)}`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Choose Method <span className="text-error">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {foodItem.pickup && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pickupOrDelivery: 'pickup' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.pickupOrDelivery === 'pickup'
                      ? 'border-primary bg-primary/5'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Home size={24} className="mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium">Pickup</div>
                </button>
              )}
              {foodItem.delivery && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, pickupOrDelivery: 'delivery' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.pickupOrDelivery === 'delivery'
                      ? 'border-primary bg-primary/5'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Truck size={24} className="mx-auto mb-2 text-primary" />
                  <div className="text-sm font-medium">Delivery</div>
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Proposed Time (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="datetime-local"
                value={formData.proposedTime}
                onChange={(e) => setFormData({ ...formData, proposedTime: e.target.value })}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Message (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-neutral-400" size={20} />
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add any special requests or questions..."
                rows={4}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none resize-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={requestMutation.isPending}
            icon={Send}
            className="w-full"
          >
            Send Request
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

export default RequestModal
