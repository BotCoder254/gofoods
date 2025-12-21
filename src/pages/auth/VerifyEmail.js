import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader as LoaderIcon } from 'lucide-react'
import { account } from '../../config/appwrite'
import { updateUser } from '../../lib/users'
import { Button } from '../../components/common/FormElements'

const VerifyEmail = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    verifyEmail()
  }, [])

  const verifyEmail = async () => {
    try {
      const userId = searchParams.get('userId')
      const secret = searchParams.get('secret')

      if (!userId || !secret) {
        setStatus('error')
        setMessage('Invalid verification link')
        return
      }

      await account.updateVerification(userId, secret)
      
      // Update user document to mark as verified
      try {
        await updateUser(userId, { isVerified: true })
      } catch (error) {
        console.error('Failed to update user verification status:', error)
      }
      
      setStatus('success')
      setMessage('Email verified successfully!')
      
      setTimeout(() => {
        navigate('/feed')
      }, 3000)
    } catch (error) {
      setStatus('error')
      setMessage(error.message || 'Verification failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md w-full"
      >
        {status === 'verifying' && (
          <>
            <div className="w-20 h-20 mx-auto mb-6">
              <LoaderIcon className="w-full h-full text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Verifying Email
            </h2>
            <p className="text-neutral-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6"
            >
              <CheckCircle className="w-full h-full text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Email Verified!
            </h2>
            <p className="text-neutral-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
            <p className="text-sm text-neutral-500">
              Redirecting to feed...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6"
            >
              <XCircle className="w-full h-full text-error" />
            </motion.div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Verification Failed
            </h2>
            <p className="text-neutral-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default VerifyEmail
