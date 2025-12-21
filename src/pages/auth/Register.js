import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react'
import { Input, Button } from '../../components/common/FormElements'
import { useAuth } from '../../context/AuthContext'
import { validateEmail, validatePassword, validateDisplayName } from '../../utils/validation'
import { createUser } from '../../lib/users'
import { account } from '../../config/appwrite'
import { toast } from 'react-toastify'

const Register = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    displayName: '' 
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validate = () => {
    const newErrors = {}
    
    if (!validateDisplayName(formData.displayName)) {
      newErrors.displayName = 'Name must be at least 2 characters'
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
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
    if (!validate()) return

    setLoading(true)
    try {
      // Create auth account
      const response = await account.create(
        'unique()',
        formData.email,
        formData.password,
        formData.displayName
      )

      console.log('Auth account created:', response.$id)

      // Log in the user first to get proper session
      await login(formData.email, formData.password)

      console.log('User logged in successfully')

      // Create user document in database
      try {
        const userDoc = await createUser(response.$id, formData.email, formData.displayName)
        console.log('User document created:', userDoc)
      } catch (dbError) {
        console.error('Database error:', dbError)
        toast.error('Account created but profile setup failed. Please contact support.')
      }

      // Send verification email
      try {
        await account.createVerification(`${window.location.origin}/verify-email`)
        toast.success('Verification email sent! Please check your inbox.')
      } catch (verifyError) {
        console.error('Verification email error:', verifyError)
      }
      
      toast.success('Account created successfully!')
      navigate('/feed')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-accent to-secondary">
        <div className="absolute inset-0 bg-black/20" />
        <img
          src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&q=80"
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
              Join GoFoods
            </h1>
            <p className="text-xl opacity-90" style={{ fontFamily: 'Inter, sans-serif' }}>
              Connect with your local food community
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-neutral-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Create Account
            </h2>
            <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Start sharing and discovering local food
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={formData.displayName}
              onChange={handleChange('displayName')}
              error={errors.displayName}
              icon={User}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              error={errors.email}
              icon={Mail}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
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

            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                required
                className="w-4 h-4 mt-1 rounded border-neutral-300 text-primary focus:ring-primary" 
              />
              <span className="text-sm text-neutral-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary hover:text-primary/80">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <Button type="submit" variant="primary" fullWidth loading={loading} icon={ArrowRight}>
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:text-primary/80">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
