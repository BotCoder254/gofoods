import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowLeft, ArrowRight, Check, Upload, Clock, Users, Plus, Trash2, ChefHat, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createRecipe, uploadRecipeImage, getRecipeImageUrl } from '../../lib/recipes'
import { getFoodItems } from '../../lib/foodItems'
import { Input, Button } from '../common/FormElements'
import { toast } from 'react-toastify'

const CreateRecipeModal = ({ isOpen, onClose }) => {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [''],
    steps: [''],
    cookTimeMinutes: '',
    servings: '',
    linkedFoodItemId: ''
  })

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  const { data: foodItems } = useQuery({
    queryKey: ['myFoodItems'],
    queryFn: () => getFoodItems({ ownerId: session?.$id }),
    enabled: !!session?.$id && isOpen
  })

  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        ingredients: [''],
        steps: [''],
        cookTimeMinutes: '',
        servings: '',
        linkedFoodItemId: ''
      })
      setImageFile(null)
      setImagePreview(null)
      setStep(1)
    }
  }, [isOpen])

  const createRecipeMutation = useMutation({
    mutationFn: async (data) => {
      if (!session?.$id) {
        throw new Error('You must be logged in')
      }

      let uploadedImageId = null
      
      if (imageFile) {
        setUploading(true)
        const uploaded = await uploadRecipeImage(imageFile)
        uploadedImageId = uploaded.$id
        setUploading(false)
      }

      const payload = {
        userId: session.$id,
        title: data.title,
        description: data.description || '',
        ingredients: JSON.stringify(data.ingredients.filter(i => i.trim())),
        steps: JSON.stringify(data.steps.filter(s => s.trim())),
        cookTimeMinutes: parseInt(data.cookTimeMinutes),
        servings: data.servings ? parseInt(data.servings) : null,
        imageId: uploadedImageId,
        linkedFoodItemId: data.linkedFoodItemId || null
      }

      return await createRecipe(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes'])
      toast.success('Recipe created successfully!')
      onClose()
      navigate('/recipes')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create recipe')
      setUploading(false)
    }
  })

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setImageFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const addIngredient = () => {
    setFormData({ ...formData, ingredients: [...formData.ingredients, ''] })
  }

  const removeIngredient = (index) => {
    setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) })
  }

  const updateIngredient = (index, value) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = value
    setFormData({ ...formData, ingredients: newIngredients })
  }

  const addStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] })
  }

  const removeStep = (index) => {
    setFormData({ ...formData, steps: formData.steps.filter((_, i) => i !== index) })
  }

  const updateStep = (index, value) => {
    const newSteps = [...formData.steps]
    newSteps[index] = value
    setFormData({ ...formData, steps: newSteps })
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.cookTimeMinutes) {
      toast.error('Please fill in all required fields')
      return
    }
    
    const validIngredients = formData.ingredients.filter(i => i.trim())
    const validSteps = formData.steps.filter(s => s.trim())
    
    if (validIngredients.length === 0) {
      toast.error('Please add at least one ingredient')
      return
    }
    
    if (validSteps.length === 0) {
      toast.error('Please add at least one step')
      return
    }

    createRecipeMutation.mutate(formData)
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
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Create Recipe
            </h2>
            <p className="text-sm text-neutral-600 mt-1">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg">
            <X size={24} />
          </button>
        </div>

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
                  label="Recipe Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Classic Chocolate Chip Cookies"
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your recipe..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Cooking Time (minutes)"
                    type="number"
                    value={formData.cookTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, cookTimeMinutes: e.target.value })}
                    placeholder="30"
                    icon={Clock}
                    required
                  />

                  <Input
                    label="Servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                    placeholder="4"
                    icon={Users}
                  />
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
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Ingredients <span className="text-error">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={ingredient}
                          onChange={(e) => updateIngredient(index, e.target.value)}
                          placeholder={`Ingredient ${index + 1}`}
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
                        />
                        {formData.ingredients.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="mt-3 flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                    Add Ingredient
                  </button>
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
                    Cooking Steps <span className="text-error">*</span>
                  </label>
                  <div className="space-y-3">
                    {formData.steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm mt-2">
                          {index + 1}
                        </div>
                        <textarea
                          value={step}
                          onChange={(e) => updateStep(index, e.target.value)}
                          placeholder={`Step ${index + 1}`}
                          rows={2}
                          className="flex-1 px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none resize-none"
                        />
                        {formData.steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addStep}
                    className="mt-3 flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-xl transition-colors"
                  >
                    <Plus size={20} />
                    Add Step
                  </button>
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
                    Recipe Image (Optional)
                  </label>
                  
                  {imagePreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-neutral-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-2 bg-error text-white rounded-full hover:bg-error/90"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-video rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary cursor-pointer flex flex-col items-center justify-center gap-2 transition-all bg-neutral-50 hover:bg-neutral-100">
                      <Upload size={48} className="text-neutral-400" />
                      <span className="text-sm text-neutral-600 font-medium">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Link to Food Item (Optional)
                  </label>
                  <select
                    value={formData.linkedFoodItemId}
                    onChange={(e) => setFormData({ ...formData, linkedFoodItemId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary outline-none"
                  >
                    <option value="">No linked item</option>
                    {foodItems?.documents?.map((item) => (
                      <option key={item.$id} value={item.$id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-sm text-neutral-600">
                    Link this recipe to a food item you're selling or sharing
                  </p>
                </div>

                <div className="p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <Check size={20} className="text-primary" />
                    Preview
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div><strong>Title:</strong> {formData.title || 'Not set'}</div>
                    <div><strong>Cook Time:</strong> {formData.cookTimeMinutes || '0'} minutes</div>
                    {formData.servings && <div><strong>Servings:</strong> {formData.servings}</div>}
                    <div><strong>Ingredients:</strong> {formData.ingredients.filter(i => i.trim()).length}</div>
                    <div><strong>Steps:</strong> {formData.steps.filter(s => s.trim()).length}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
              loading={createRecipeMutation.isPending || uploading}
              icon={Check}
            >
              Publish Recipe
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default CreateRecipeModal
