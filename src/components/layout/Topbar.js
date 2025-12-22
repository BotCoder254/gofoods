import React, { useState } from 'react'
import { Menu, Search, User, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAvatarUrl } from '../../lib/users'
import { motion, AnimatePresence } from 'framer-motion'
import CreatePostModal from '../posts/CreatePostModal'
import NotificationDropdown from '../notifications/NotificationDropdown'
import SearchModal from '../common/SearchModal'
import { toast } from 'react-toastify'

const Topbar = ({ onMenuClick, onSearch }) => {
  const { user } = useAuth()
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-3 lg:gap-4 max-w-screen-2xl mx-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-neutral-200 hover:border-primary transition-all text-left bg-white"
          >
            <Search className="text-neutral-400" size={20} />
            <span className="text-neutral-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Search for food...
            </span>
          </button>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Create Post Button - Desktop */}
          {user?.isVerified ? (
            <button
              onClick={() => setShowCreatePost(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all font-medium whitespace-nowrap"
            >
              <PlusCircle size={20} />
              <span>Create Post</span>
            </button>
          ) : (
            <button
              onClick={() => toast.info('Please verify your email to create posts')}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-300 text-neutral-500 rounded-xl cursor-not-allowed font-medium whitespace-nowrap"
            >
              <PlusCircle size={20} />
              <span>Create Post</span>
            </button>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Avatar */}
          <Link to="/profile" className="hidden sm:block flex-shrink-0">
            <img
              src={user?.avatarFileId ? getAvatarUrl(user.avatarFileId) : `https://ui-avatars.com/api/?name=${user?.displayName}&background=FF5136&color=fff`}
              alt={user?.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-neutral-200 hover:border-primary transition-colors"
            />
          </Link>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
      
      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </header>
  )
}

export default Topbar
