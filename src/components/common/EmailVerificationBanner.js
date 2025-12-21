import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { account } from '../../config/appwrite'
import { Button } from '../common/FormElements'
import { toast } from 'react-toastify'

const EmailVerificationBanner = ({ user, onVerified }) => {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)

  const handleResendVerification = async () => {
    setLoading(true)
    try {
      await account.createVerification(`${window.location.origin}/verify-email`)
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error(error.message || 'Failed to send verification email')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckVerification = async () => {
    setChecking(true)
    try {
      const session = await account.get()
      if (session.emailVerification) {
        toast.success('Email verified successfully!')
        onVerified()
      } else {
        toast.info('Email not verified yet. Please check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to check verification status')
    } finally {
      setChecking(false)
    }
  }

  // Check if email is verified from Appwrite session
  const [isVerified, setIsVerified] = useState(false)
  
  React.useEffect(() => {
    const checkVerification = async () => {
      try {
        const session = await account.get()
        setIsVerified(session.emailVerification)
      } catch (error) {
        console.error('Error checking verification:', error)
      }
    }
    checkVerification()
  }, [])

  if (isVerified) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border-l-4 border-warning p-4 mb-6 rounded-lg"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-warning flex-shrink-0 mt-1" size={24} />
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Verify Your Email
          </h3>
          <p className="text-sm text-neutral-700 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Please verify your email address to access all features. Check your inbox for the verification link.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleResendVerification}
              loading={loading}
              icon={Mail}
            >
              Resend Email
            </Button>
            <Button
              variant="ghost"
              onClick={handleCheckVerification}
              loading={checking}
              icon={RefreshCw}
            >
              I've Verified
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default EmailVerificationBanner
