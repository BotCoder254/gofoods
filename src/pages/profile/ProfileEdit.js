import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Camera, MapPin, Phone, Mail, Save, X, Loader as LoaderIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { updateUser, uploadAvatar, deleteAvatar, getAvatarUrl } from '../../lib/users'
import { Input, Button } from '../../components/common/FormElements'
import { validatePhone, validateDisplayName } from '../../utils/validation'
import { toast } from 'react-toastify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import LocationPicker from '../../components/profile/LocationPicker'

const ProfileEdit = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    location: user?.location || null
  })
  
  const [errors, setErrors] = useState({})
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatarFileId ? getAvatarUrl(user.avatarFileId) : null
  )
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      let avatarFileId = user?.avatarFileId

      // Upload new avatar if selected
      if (avatarFile) {
        if (avatarFileId) {
          await deleteAvatar(avatarFileId)
        }
        const uploadedFile = await uploadAvatar(avatarFile)
        avatarFileId = uploadedFile.$id
      }

      return await updateUser(user.$id, {
        ...data,
        avatarFileId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser'])
      toast.success('Profile updated successfully!')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile')
    }
  })

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleLocationSelect = (location) => {
    setFormData({ ...formData, location })
    setShowLocationPicker(false)
  }

  const validate = () => {
    const newErrors = {}
    
    if (!validateDisplayName(formData.displayName)) {
      newErrors.displayName = 'Name must be at least 2 characters'
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    updateProfileMutation.mutate(formData)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Edit Profile
          </h1>
          <p className="text-white/90 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Update your personal information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={avatarPreview || `https://ui-avatars.com/api/?name=${formData.displayName}&background=FF5136&color=fff&size=200`}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-neutral-200"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90"
              >
                <Camera size={20} />
              </motion.button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-neutral-500">
              Click the camera icon to upload a new photo (max 5MB)
            </p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Display Name"
              type="text"
              value={formData.displayName}
              onChange={handleChange('displayName')}
              error={errors.displayName}
              icon={Mail}
              placeholder="Your name"
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange('phone')}
              error={errors.phone}
              icon={Phone}
              placeholder="+1 234 567 8900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={handleChange('bio')}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none transition-all resize-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Location
            </label>
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 flex items-center gap-3">
                <MapPin size={20} className="text-neutral-400" />
                <span className="text-neutral-700">
                  {formData.location?.placeName || 'No location set'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationPicker(true)}
              >
                {formData.location ? 'Change' : 'Set Location'}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={updateProfileMutation.isPending}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          onSelect={handleLocationSelect}
          onClose={() => setShowLocationPicker(false)}
          initialLocation={formData.location}
        />
      )}
    </div>
  )
}

export default ProfileEdit
