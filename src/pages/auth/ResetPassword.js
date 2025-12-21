import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft } from 'lucide-react'
import { Input, Button } from '../../components/common/FormElements'
import { validatePassword } from '../../utils/validation'
import { account } from '../../config/appwrite'
import { toast } from 'react-toastify'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const userId = searchParams.get('userId')
  const secret = searchParams.get('secret')

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!userId || !secret) {
      toast.error('Invalid reset link')
      return
    }

    if (!validate()) return

    setLoading(true)
    try {
      await account.updateRecovery(userId, secret, formData.password)
      toast.success('Password reset successfully!')
      navigate('/login')
    } catch (error) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary to-accent">
        <div className="absolute inset-0 bg-black/20" />
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80"
          alt="Food"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white text-center"
          >
            <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              New Password
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
              Create a strong password for your account
            </p>
          </motion.div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/login" className="inline-flex items-center gap-2 text-neutral-600 hover:text-primary mb-8">
            <ArrowLeft size={20} />
            <span>Back to Login</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Reset Password
            </h2>
            <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange('password')}
              error={errors.password}
              icon={Lock}
              placeholder="At least 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              error={errors.confirmPassword}
              icon={Lock}
              placeholder="Re-enter your password"
              required
            />

            <Button type="submit" variant="primary" fullWidth loading={loading}>
              Reset Password
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default ResetPassword
