import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Map, 
  PlusCircle, 
  MessageSquare, 
  Bookmark, 
  User, 
  Shield,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  Settings,
  Popcorn,
  ClipboardList
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAvatarUrl } from '../../lib/users'
import { toast } from 'react-toastify'
import CreatePostModal from '../posts/CreatePostModal'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showCreatePost, setShowCreatePost] = useState(false)

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed', badge: null },
    { path: '/map', icon: Map, label: 'Map', badge: null },
    { path: '/requests', icon: ClipboardList, label: 'Requests', badge: null },
    { path: '/bookmarks', icon: Bookmark, label: 'Bookmarks', badge: null },
    { path: '/profile', icon: User, label: 'Profile', badge: null }
  ]

  if (user?.role === 'admin' || user?.role === 'moderator') {
    navItems.push({ path: '/admin', icon: Shield, label: 'Admin', badge: null })
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Logged out successfully')
      navigate('/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed top-0 left-0 h-screen bg-white border-r border-neutral-200 z-50 w-72 flex flex-col lg:translate-x-0 lg:static"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <Link to="/feed" className="flex items-center gap-3">
            <Popcorn className="text-primary" size={32} />
            <span className="text-xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              GoFoods
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navItems.map((item, index) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <Icon size={22} />
                  <span className="font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="ml-auto bg-error text-white text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-100 cursor-pointer">
            <img
              src={user?.avatarFileId ? getAvatarUrl(user.avatarFileId) : `https://ui-avatars.com/api/?name=${user?.displayName}&background=FF5136&color=fff`}
              alt={user?.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                {user?.displayName}
              </p>
              <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-error hover:bg-error/10 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Floating Create Button - Desktop & Mobile */}
      <button
        onClick={() => setShowCreatePost(true)}
        className="fixed bottom-24 lg:bottom-8 right-6 w-16 h-16 bg-warning hover:bg-warning/90 text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all hover:scale-110"
      >
        <PlusCircle size={28} />
      </button>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </>
  )
}

export default Sidebar
