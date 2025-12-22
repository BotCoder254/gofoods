import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getUserById, updateUser, uploadAvatar, getAvatarUrl } from '../../lib/users'
import { User, Camera, MapPin, Phone, Mail, Edit2, Save, X } from 'lucide-react'
import { toast } from 'react-toastify'
import Loader from '../../components/common/Loader'
import LocationPicker from '../../components/profile/LocationPicker'

const Profile = () => {
  const { session, user: authUser } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    phone: '',
    location: null
  })

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', session?.$id],
    queryFn: () => getUserById(session.$id),
    enabled: !!session?.$id,
    onSuccess: (data) => {
      setFormData({
        displayName: data.displayName || '',
        bio: data.bio || '',
        phone: data.phone || '',
        location: data.location || null
      })
    }
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateUser(session.$id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile')
    }
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      setIsUploading(true)
      setUploadProgress(0)
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 100)
      
      const fileId = await uploadAvatar(file)
      await updateUser(session.$id, { avatarFileId: fileId })
      
      clearInterval(interval)
      setUploadProgress(100)
      
      return fileId
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user'])
      toast.success('Avatar updated successfully!')
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload avatar')
      setIsUploading(false)
      setUploadProgress(0)
    }
  })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      uploadAvatarMutation.mutate(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    setFormData({
      displayName: user.displayName || '',
      bio: user.bio || '',
      phone: user.phone || '',
      location: user.location || null
    })
    setIsEditing(false)
  }

  if (isLoading) {
    return <Loader fullScreen />
  }

  const avatarUrl = user?.avatarFileId 
    ? getAvatarUrl(user.avatarFileId) 
    : `https://ui-avatars.com/api/?name=${user?.displayName}&background=FF5136&color=fff&size=200`

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8"
      >
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-neutral-200 bg-white overflow-hidden">
              <img src={avatarUrl} alt={user?.displayName} className="w-full h-full object-cover" />
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <Loader size="sm" color="white" />
                  <div className="mt-2 text-white text-xs font-bold">{uploadProgress}%</div>
                  <div className="w-20 h-1 bg-white/30 rounded-full mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Camera Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
            >
              <Camera size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <h2 className="text-2xl font-bold text-neutral-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {user?.displayName}
          </h2>
          <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            {authUser?.email}
          </p>
        </div>

        {/* Edit Button */}
        <div className="flex justify-end mb-6">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
            >
              <Edit2 size={18} />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-200 text-neutral-900 rounded-xl hover:bg-neutral-300 transition-all font-medium"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all font-medium disabled:opacity-50"
              >
                <Save size={18} />
                <span>Save</span>
              </button>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Display Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none transition-all"
                placeholder="Enter your display name"
              />
            ) : (
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <User size={20} className="text-neutral-600" />
                <span className="text-neutral-900 font-medium">{user?.displayName}</span>
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
              <Mail size={20} className="text-neutral-600" />
              <span className="text-neutral-900">{authUser?.email}</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none transition-all resize-none"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <div className="p-4 bg-neutral-50 rounded-xl">
                <p className="text-neutral-900">{user?.bio || 'No bio added yet'}</p>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-neutral-200 focus-within:border-primary transition-all">
                <Phone size={20} className="text-neutral-600" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="flex-1 outline-none"
                  placeholder="Enter your phone number"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <Phone size={20} className="text-neutral-600" />
                <span className="text-neutral-900">{user?.phone || 'No phone number added'}</span>
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Location
            </label>
            {isEditing ? (
              <button
                type="button"
                onClick={() => setShowLocationPicker(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-neutral-200 hover:border-primary transition-all text-left"
              >
                <MapPin size={20} className="text-neutral-600" />
                <span className="text-neutral-900">
                  {formData.location?.placeName || 'Set your location'}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
                <MapPin size={20} className="text-neutral-600" />
                <span className="text-neutral-900">
                  {user?.location?.placeName || 'No location set'}
                </span>
              </div>
            )}
          </div>
        </form>
      </motion.div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          initialLocation={formData.location}
          onLocationSelect={(location) => {
            setFormData({ ...formData, location })
            setShowLocationPicker(false)
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  )
}

export default Profile
