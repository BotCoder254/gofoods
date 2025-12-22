import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ArrowLeft, ArrowRight, Check, Upload, MapPin, DollarSign, 
  Package, Clock, Truck, Home, UtensilsCrossed, Croissant, 
  Apple, Popcorn, Coffee, ShoppingBag, Tag, AlertCircle
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFoodItem, uploadFoodImage, updateFoodItem, getFoodImageUrl } from '../../lib/foodItems'
import { Input, Button } from '../common/FormElements'
import LocationPicker from '../profile/LocationPicker'
import { toast } from 'react-toastify'

const FOOD_TYPES = [
  { value: 'meal', label: 'Meal', icon: UtensilsCrossed },
  { value: 'baked', label: 'Baked Goods', icon: Croissant },
  { value: 'produce', label: 'Produce', icon: Apple },
  { value: 'snack', label: 'Snack', icon: Popcorn },
  { value: 'beverage', label: 'Beverage', icon: Coffee },
  { value: 'other', label: 'Other', icon: ShoppingBag }
]

const TAGS = ['Vegan', 'Vegetarian', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Organic', 'Homemade']

const CreatePostModal = ({ isOpen, onClose, editItem = null }) => {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  const isEditMode = !!editItem
  
  const [formData, setFormData] = useState({
    title: '',
    foodType: 'meal',
    isDonation: false,
    price: '',
    quantity: '',
    description: '',
    tags: [],
    pickup: true,
    delivery: false,
    pickupAddress: user?.location || null,
    deliveryRadiusKm: '',
    availableFrom: '',
    availableUntil: '',
    images: []
  })

  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Load edit data
  React.useEffect(() => {
    if (editItem && isOpen) {
      setFormData({
        title: editItem.title || '',
        foodType: editItem.foodType || 'meal',
        isDonation: editItem.isDonation || false,
        price: editItem.price?.toString() || '',
        quantity: editItem.quantity?.toString() || '',
        description: editItem.description || '',
        tags: editItem.tags || [],
        pickup: editItem.pickup ?? true,
        delivery: editItem.delivery ?? false,
        pickupAddress: editItem.pickupAddress || null,
        deliveryRadiusKm: editItem.deliveryRadiusKm?.toString() || '',
        availableFrom: editItem.availableFrom || '',
        availableUntil: editItem.availableUntil || '',
        images: editItem.images || []
      })
      setExistingImages(editItem.images || [])
    } else if (!isOpen) {
      setFormData({
        title: '',
        foodType: 'meal',
        isDonation: false,
        price: '',
        quantity: '',
        description: '',
        tags: [],
        pickup: true,
        delivery: false,
        pickupAddress: user?.location || null,
        deliveryRadiusKm: '',
        availableFrom: '',
        availableUntil: '',
        images: []
      })
      setImageFiles([])
      setImagePreviews([])
      setExistingImages([])
      setStep(1)
    }
  }, [editItem, isOpen, user])

  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      if (!session?.$id) {
        throw new Error('You must be logged in')
      }

      if (isEditMode && editItem.editCount >= 3) {
        throw new Error('Maximum edit limit (3) reached for this item')
      }

      const uploadedImageIds = []
      setUploadProgress(0)
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const uploaded = await uploadFoodImage(file)
        uploadedImageIds.push(uploaded.$id)
        setUploadProgress(((i + 1) / imageFiles.length) * 100)
      }

      const allImages = [...existingImages, ...uploadedImageIds]

      const payload = {
        title: data.title,
        description: data.description || '',
        images: JSON.stringify(allImages),
        foodType: data.foodType,
        tags: JSON.stringify(data.tags),
        quantity: parseInt(data.quantity),
        price: data.isDonation ? 0 : parseFloat(data.price || 0),
        isDonation: data.isDonation,
        pickup: data.pickup,
        delivery: data.delivery,
        pickupAddress: data.pickupAddress ? JSON.stringify(data.pickupAddress) : null,
        deliveryRadiusKm: data.delivery ? parseFloat(data.deliveryRadiusKm) : 0,
        availableFrom: data.availableFrom || new Date().toISOString(),
        availableUntil: data.availableUntil || null
      }

      if (isEditMode) {
        payload.editCount = (editItem.editCount || 0) + 1
        return await updateFoodItem(editItem.$id, payload)
      } else {
        payload.ownerId = session.$id
        payload.editCount = 0
        return await createFoodItem(payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['foodItems'])
      queryClient.invalidateQueries(['foodItem', editItem?.$id])
      toast.success(isEditMode ? 'Post updated successfully!' : 'Post created successfully!')
      setUploadProgress(0)
      onClose()
      if (!isEditMode) navigate('/feed')
    },
    onError: (error) => {
      toast.error(error.message || `Failed to ${isEditMode ? 'update' : 'create'} post`)
      setUploadProgress(0)
    }
  })

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    const totalImages = existingImages.length + imageFiles.length + files.length
    if (totalImages > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Each image must be less than 5MB')
        return
      }
    })

    setImageFiles([...imageFiles, ...files])
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    if (index < existingImages.length) {
      setExistingImages(existingImages.filter((_, i) => i !== index))
    } else {
      const newIndex = index - existingImages.length
      setImageFiles(imageFiles.filter((_, i) => i !== newIndex))
      setImagePreviews(imagePreviews.filter((_, i) => i !== newIndex))
    }
  }

  const moveImage = (fromIndex, toIndex) => {
    const totalExisting = existingImages.length
    
    if (fromIndex < totalExisting && toIndex < totalExisting) {
      const newExisting = [...existingImages]
      const [moved] = newExisting.splice(fromIndex, 1)
      newExisting.splice(toIndex, 0, moved)
      setExistingImages(newExisting)
    } else if (fromIndex >= totalExisting && toIndex >= totalExisting) {
      const newFiles = [...imageFiles]
      const newPreviews = [...imagePreviews]
      const adjustedFrom = fromIndex - totalExisting
      const adjustedTo = toIndex - totalExisting
      
      const [movedFile] = newFiles.splice(adjustedFrom, 1)
      const [movedPreview] = newPreviews.splice(adjustedFrom, 1)
      
      newFiles.splice(adjustedTo, 0, movedFile)
      newPreviews.splice(adjustedTo, 0, movedPreview)
      
      setImageFiles(newFiles)
      setImagePreviews(newPreviews)
    }
  }

  const toggleTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.includes(tag)
        ? formData.tags.filter(t => t !== tag)
        : [...formData.tags, tag]
    })
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.quantity) {
      toast.error('Please fill in all required fields')
      return
    }
    if (!formData.isDonation && !formData.price) {
      toast.error('Please set a price or mark as donation')
      return
    }
    if (formData.pickup && !formData.pickupAddress) {
      toast.error('Please set pickup location')
      return
    }
    if (formData.delivery && !formData.deliveryRadiusKm) {
      toast.error('Please set delivery radius')
      return
    }

    createPostMutation.mutate(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {isEditMode ? 'Edit Food Post' : 'Create Food Post'}
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Step {step} of 4
              {isEditMode && (
                <span className="ml-2 text-warning">
                  <AlertCircle size={14} className="inline mb-0.5" /> {3 - (editItem?.editCount || 0)} edits remaining
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-primary' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Homemade Lasagna"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Food Type <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {FOOD_TYPES.map((type) => {
                      const TypeIcon = type.icon
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, foodType: type.value })}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.foodType === type.value
                              ? 'border-primary bg-primary/5'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <TypeIcon size={32} className="mx-auto mb-2 text-primary" />
                          <div className="text-sm font-medium">{type.label}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Number of servings"
                    icon={Package}
                    required
                  />

                  <div>
                    <label className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        checked={formData.isDonation}
                        onChange={(e) => setFormData({ ...formData, isDonation: e.target.checked })}
                        className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-neutral-700">This is a donation (free)</span>
                    </label>
                    {!formData.isDonation && (
                      <Input
                        label="Price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        icon={DollarSign}
                        required
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your food item, ingredients, allergens..."
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Tags (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.tags.includes(tag)
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Fulfillment Options <span className="text-error">*</span>
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary transition-all">
                      <input
                        type="checkbox"
                        checked={formData.pickup}
                        onChange={(e) => setFormData({ ...formData, pickup: e.target.checked })}
                        className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <Home size={24} className="text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">Pickup</div>
                        <div className="text-sm text-neutral-600">Buyer picks up from your location</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary transition-all">
                      <input
                        type="checkbox"
                        checked={formData.delivery}
                        onChange={(e) => setFormData({ ...formData, delivery: e.target.checked })}
                        className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <Truck size={24} className="text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">Delivery</div>
                        <div className="text-sm text-neutral-600">You deliver within a radius</div>
                      </div>
                    </label>
                  </div>
                </div>

                {formData.pickup && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Pickup Location <span className="text-error">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 flex items-center gap-3">
                        <MapPin size={20} className="text-neutral-400" />
                        <span className="text-neutral-700 text-sm">
                          {formData.pickupAddress?.placeName || 'No location set'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowLocationPicker(true)}
                      >
                        Set Location
                      </Button>
                    </div>
                  </div>
                )}

                {formData.delivery && (
                  <Input
                    label="Delivery Radius (km)"
                    type="number"
                    step="0.1"
                    value={formData.deliveryRadiusKm}
                    onChange={(e) => setFormData({ ...formData, deliveryRadiusKm: e.target.value })}
                    placeholder="e.g., 5"
                    icon={Truck}
                    required
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Available From
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableFrom}
                      onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Available Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.availableUntil}
                      onChange={(e) => setFormData({ ...formData, availableUntil: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Images (Up to 5)
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {existingImages.map((imageId, index) => (
                      <motion.div
                        key={`existing-${imageId}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-neutral-200 group"
                      >
                        <img src={getFoodImageUrl(imageId, 400, 400)} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                        
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-full hover:bg-error/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Check size={12} />
                            Cover
                          </div>
                        )}
                        
                        {(existingImages.length + imagePreviews.length) > 1 && (
                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index - 1)}
                                className="p-1.5 bg-white/90 rounded-full hover:bg-white"
                              >
                                <ArrowLeft size={14} />
                              </button>
                            )}
                            {index < (existingImages.length + imagePreviews.length - 1) && (
                              <button
                                type="button"
                                onClick={() => moveImage(index, index + 1)}
                                className="p-1.5 bg-white/90 rounded-full hover:bg-white"
                              >
                                <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {imagePreviews.map((preview, index) => (
                      <motion.div
                        key={`new-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden border-2 border-neutral-200 group"
                      >
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        
                        <button
                          type="button"
                          onClick={() => removeImage(existingImages.length + index)}
                          className="absolute top-2 right-2 p-1.5 bg-error text-white rounded-full hover:bg-error/90 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                        
                        {(existingImages.length === 0 && index === 0) && (
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-primary text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <Check size={12} />
                            Cover
                          </div>
                        )}
                        
                        {(existingImages.length + imagePreviews.length) > 1 && (
                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(existingImages.length + index) > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(existingImages.length + index, existingImages.length + index - 1)}
                                className="p-1.5 bg-white/90 rounded-full hover:bg-white"
                              >
                                <ArrowLeft size={14} />
                              </button>
                            )}
                            {(existingImages.length + index) < (existingImages.length + imagePreviews.length - 1) && (
                              <button
                                type="button"
                                onClick={() => moveImage(existingImages.length + index, existingImages.length + index + 1)}
                                className="p-1.5 bg-white/90 rounded-full hover:bg-white"
                              >
                                <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {(existingImages.length + imagePreviews.length) < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-all bg-neutral-50 hover:bg-neutral-100">
                        <Upload size={32} className="text-neutral-400" />
                        <span className="text-sm text-neutral-600 font-medium">Add Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <p>
                      First image will be the cover photo. Drag to reorder. Max 5MB per image.
                    </p>
                  </div>
                </div>

                {/* Upload Progress */}
                {createPostMutation.isPending && uploadProgress > 0 && (
                  <div className="p-4 bg-primary/5 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-700">Uploading images...</span>
                      <span className="text-sm font-bold text-primary">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Check size={20} className="text-primary" />
                    Preview
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Package size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Title:</strong> {formData.title || 'Not set'}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Type:</strong> {FOOD_TYPES.find(t => t.value === formData.foodType)?.label}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Quantity:</strong> {formData.quantity || 'Not set'} servings
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <DollarSign size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Price:</strong> {formData.isDonation ? 'Free (Donation)' : `$${formData.price || '0'}`}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Home size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Pickup:</strong> {formData.pickup ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <strong>Delivery:</strong> {formData.delivery ? `Yes (${formData.deliveryRadiusKm}km)` : 'No'}
                      </div>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Tag size={16} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Tags:</strong> {formData.tags.join(', ')}
                        </div>
                      </div>
                    )}
                    {(existingImages.length + imagePreviews.length) > 0 && (
                      <div className="flex items-start gap-2">
                        <Upload size={16} className="text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Images:</strong> {existingImages.length + imagePreviews.length} photo{(existingImages.length + imagePreviews.length) > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            icon={ArrowLeft}
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </Button>

          {step < 4 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)} icon={ArrowRight}>
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={createPostMutation.isPending}
              icon={Check}
            >
              {isEditMode ? 'Update Post' : 'Publish Post'}
            </Button>
          )}
        </div>
      </motion.div>

      {showLocationPicker && (
        <LocationPicker
          onSelect={(location) => {
            setFormData({ ...formData, pickupAddress: location })
            setShowLocationPicker(false)
          }}
          onClose={() => setShowLocationPicker(false)}
          initialLocation={formData.pickupAddress}
        />
      )}
    </div>
  )
}

export default CreatePostModal
