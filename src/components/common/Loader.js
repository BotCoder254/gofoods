import React from 'react'
import { motion } from 'framer-motion'
import { Popcorn } from 'lucide-react'

const Loader = ({ size = 'md', fullScreen = false, color }) => {
  const sizes = {
    sm: 24,
    md: 40,
    lg: 56
  }

  const iconSize = sizes[size]

  const loader = (
    <motion.div
      animate={{
        y: [0, -10, 0],
        rotate: [-5, 5, -5]
      }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Popcorn size={iconSize} className={color || "text-primary"} />
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {loader}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-neutral-600 font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Loading...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  return loader
}

export default Loader
