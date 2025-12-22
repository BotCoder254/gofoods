import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, MapPin, Clock, User, Package, Home, Truck } from 'lucide-react'
import { Button } from '../common/FormElements'
import { getAvatarUrl } from '../../lib/users'

const RequestConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  request, 
  foodItem,
  requesterProfile,
  loading = false 
}) => {
  if (!isOpen || !request || !foodItem) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Confirm Request
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Food Item Details */}
            <div className="p-4 bg-neutral-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Package size={20} className="text-primary" />
                <h3 className="font-bold text-neutral-900">Food Item</h3>
              </div>
              <p className="text-lg font-bold text-neutral-900">{foodItem.title}</p>
              {foodItem.description && (
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{foodItem.description}</p>
              )}
              <p className="text-primary font-bold mt-2">
                {foodItem.isDonation ? 'Free (Donation)' : `$${foodItem.price?.toFixed(2)}`}
              </p>
            </div>

            {/* Requester Profile */}
            {requesterProfile && (
              <div className="p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <User size={20} className="text-primary" />
                  <h3 className="font-bold text-neutral-900">Requester</h3>
                </div>
                <div className="flex items-center gap-3">
                  {requesterProfile.avatarFileId ? (
                    <img 
                      src={getAvatarUrl(requesterProfile.avatarFileId)} 
                      alt={requesterProfile.displayName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={24} className="text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-neutral-900">{requesterProfile.displayName}</p>
                    <p className="text-sm text-neutral-600">{requesterProfile.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Request Details */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                {request.pickupOrDelivery === 'pickup' ? (
                  <Home size={20} className="text-primary mt-0.5" />
                ) : (
                  <Truck size={20} className="text-primary mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-neutral-900">
                    {request.pickupOrDelivery === 'pickup' ? 'Pickup' : 'Delivery'}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {request.pickupOrDelivery === 'pickup' 
                      ? 'Requester will pick up the item' 
                      : 'Item will be delivered to requester'}
                  </p>
                </div>
              </div>

              {request.proposedTime && (
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                  <Clock size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900">Proposed Time</p>
                    <p className="text-sm text-neutral-600">
                      {new Date(request.proposedTime).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {foodItem.pickupAddress && (
                <div className="flex items-start gap-3 p-3 bg-neutral-50 rounded-xl">
                  <MapPin size={20} className="text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-neutral-900">Location</p>
                    <p className="text-sm text-neutral-600">
                      {foodItem.pickupAddress.placeName || 'Location set'}
                    </p>
                  </div>
                </div>
              )}

              {request.message && (
                <div className="p-4 bg-neutral-50 rounded-xl">
                  <p className="font-medium text-neutral-900 mb-2">Message</p>
                  <p className="text-sm text-neutral-700">{request.message}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-xl font-medium border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <Button
                onClick={onConfirm}
                loading={loading}
                icon={Check}
                variant="primary"
                className="flex-1"
              >
                Accept Request
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default RequestConfirmationModal
