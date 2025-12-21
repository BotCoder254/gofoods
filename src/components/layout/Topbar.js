import React, { useState } from 'react'
import { Menu, Search, User, PlusCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAvatarUrl } from '../../lib/users'
import { motion, AnimatePresence } from 'framer-motion'
import CreatePostModal from '../posts/CreatePostModal'
import NotificationDropdown from '../notifications/NotificationDropdown'

const Topbar = ({ onMenuClick, onSearch }) => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (onSearch) {
      onSearch(searchQuery)
    }
  }

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
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for food, users, or locations..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </form>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {/* Create Post Button - Desktop */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all font-medium whitespace-nowrap"
          >
            <PlusCircle size={20} />
            <span>Create Post</span>
          </button>

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
    </header>
  )
}

export default Topbar
