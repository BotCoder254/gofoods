import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Shield, Star, MessageSquare, X } from 'lucide-react'
import { Button } from '../common/FormElements'
import { toast } from 'react-toastify'

const SafetyCheckIn = ({ isOpen, onClose, onConfirm, type = 'pickup', otherPartyName }) => {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [confirming, setConfirming] = useState(false)

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await onConfirm({ rating, feedback })
      toast.success(`${type === 'pickup' ? 'Pickup' : 'Delivery'} confirmed successfully!`)
      onClose()
    } catch (error) {
      toast.error('Failed to confirm. Please try again.')
    } finally {
      setConfirming(false)
    }
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
        <div className="p-4 md:p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Shield size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Safety Check-In
              </h2>
              <p className="text-xs md:text-sm text-neutral-600">
                Confirm {type === 'pickup' ? 'pickup' : 'delivery'} completion
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle size={20} className="text-accent" />
              <span className="font-medium text-sm md:text-base text-neutral-900">
                {type === 'pickup' ? 'Pickup' : 'Delivery'} Successful?
              </span>
            </div>
            <p className="text-xs md:text-sm text-neutral-600">
              Please confirm that you have successfully {type === 'pickup' ? 'picked up' : 'received'} the item from {otherPartyName}.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Rate Your Experience
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'text-warning fill-warning' : 'text-neutral-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Feedback (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-neutral-400" size={18} />
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none resize-none text-sm"
              />
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-start gap-2 text-xs md:text-sm text-neutral-600">
              <Shield size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <p>
                Your confirmation helps maintain a safe and trustworthy community. Both parties will be notified.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-neutral-200 flex gap-3">
          <Button variant="outline" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            fullWidth 
            onClick={handleConfirm}
            loading={confirming}
            icon={CheckCircle}
            disabled={rating === 0}
          >
            Confirm {type === 'pickup' ? 'Pickup' : 'Delivery'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default SafetyCheckIn
