import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Map, MessageSquare, User } from 'lucide-react'
import { motion } from 'framer-motion'

const BottomNav = () => {
  const location = useLocation()

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/messages', icon: MessageSquare, label: 'Messages', badge: 3 },
    { path: '/profile', icon: User, label: 'Profile' }
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 px-3 py-2 flex-1"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', duration: 0.5 }}
                />
              )}
              <div className="relative">
                <Icon
                  size={24}
                  className={isActive ? 'text-primary' : 'text-neutral-500'}
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? 'text-primary' : 'text-neutral-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
