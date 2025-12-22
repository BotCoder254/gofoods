import React from 'react'
import { motion } from 'framer-motion'
import { User, Star, ArrowRight, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '../../lib/users'

const StatusIndicator = ({ request, isIncoming }) => {
  const { data: requester } = useQuery({
    queryKey: ['user', request.requesterId],
    queryFn: () => getUserById(request.requesterId),
    enabled: !!request.requesterId
  })

  const { data: owner } = useQuery({
    queryKey: ['user', request.ownerId],
    queryFn: () => getUserById(request.ownerId),
    enabled: !!request.ownerId
  })

  const statusConfig = {
    pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Pending' },
    accepted: { icon: CheckCircle, color: 'text-accent', bg: 'bg-accent/10', label: 'Accepted' },
    rejected: { icon: XCircle, color: 'text-error', bg: 'bg-error/10', label: 'Rejected' },
    completed: { icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Completed' },
    collected: { icon: CheckCircle, color: 'text-secondary', bg: 'bg-secondary/10', label: 'Collected' }
  }

  const status = statusConfig[request.status] || statusConfig.pending
  const StatusIcon = status.icon

  const renderUserCard = (user, label, isLeft) => (
    <div className={`flex-1 ${isLeft ? 'text-left' : 'text-right'}`}>
      <div className={`inline-flex items-center gap-2 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-primary md:w-5 md:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-neutral-500">{label}</div>
          <div className="font-medium text-sm md:text-base text-neutral-900 truncate">
            {user?.displayName || 'Loading...'}
          </div>
          {user?.rating && (
            <div className="flex items-center gap-1 mt-0.5">
              <Star size={12} className="text-warning fill-warning" />
              <span className="text-xs text-neutral-600">{user.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-50 rounded-lg p-3 md:p-4 mb-3"
    >
      <div className="flex items-center gap-2 md:gap-3">
        {renderUserCard(requester, 'Requester', true)}
        
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className={`${status.bg} ${status.color} p-1.5 md:p-2 rounded-full`}>
            <StatusIcon size={14} className="md:w-4 md:h-4" />
          </div>
          <ArrowRight size={14} className="text-neutral-400 md:w-4 md:h-4" />
          <span className="text-[10px] md:text-xs font-medium text-neutral-600 whitespace-nowrap">
            {status.label}
          </span>
        </div>

        {renderUserCard(owner, 'Owner', false)}
      </div>

      {request.rating && request.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-neutral-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm text-neutral-600">Transaction Rating</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={`${
                    star <= request.rating
                      ? 'text-warning fill-warning'
                      : 'text-neutral-300'
                  } md:w-4 md:h-4`}
                />
              ))}
              <span className="text-xs md:text-sm font-bold text-neutral-900 ml-1">
                {request.rating.toFixed(1)}
              </span>
            </div>
          </div>
          {request.feedback && (
            <p className="text-xs md:text-sm text-neutral-600 mt-2 italic">
              "{request.feedback}"
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default StatusIndicator
