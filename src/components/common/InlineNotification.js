import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, MapPin, Navigation, CheckCircle, AlertCircle, Clock, X } from 'lucide-react'

const InlineNotification = ({ type, message, onClose, autoClose = true }) => {
  const [visible, setVisible] = React.useState(true)

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setVisible(false)
        if (onClose) onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const handleClose = () => {
    setVisible(false)
    if (onClose) onClose()
  }

  const configs = {
    nearby: {
      icon: MapPin,
      bg: 'bg-warning/10',
      border: 'border-warning',
      text: 'text-warning',
      iconBg: 'bg-warning/20'
    },
    arrived: {
      icon: CheckCircle,
      bg: 'bg-accent/10',
      border: 'border-accent',
      text: 'text-accent',
      iconBg: 'bg-accent/20'
    },
    tracking: {
      icon: Navigation,
      bg: 'bg-secondary/10',
      border: 'border-secondary',
      text: 'text-secondary',
      iconBg: 'bg-secondary/20'
    },
    alert: {
      icon: AlertCircle,
      bg: 'bg-error/10',
      border: 'border-error',
      text: 'text-error',
      iconBg: 'bg-error/20'
    },
    info: {
      icon: Bell,
      bg: 'bg-primary/10',
      border: 'border-primary',
      text: 'text-primary',
      iconBg: 'bg-primary/20'
    },
    eta: {
      icon: Clock,
      bg: 'bg-secondary/10',
      border: 'border-secondary',
      text: 'text-secondary',
      iconBg: 'bg-secondary/20'
    }
  }

  const config = configs[type] || configs.info
  const Icon = config.icon

  if (!visible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`${config.bg} ${config.border} border-l-4 rounded-lg p-3 md:p-4 shadow-sm`}
      >
        <div className="flex items-start gap-3">
          <div className={`${config.iconBg} p-2 rounded-lg flex-shrink-0`}>
            <Icon size={18} className={`${config.text} md:w-5 md:h-5`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm md:text-base font-medium ${config.text}`}>
              {message}
            </p>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-black/5 rounded transition-colors flex-shrink-0"
            >
              <X size={16} className="text-neutral-600" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default InlineNotification
