import React, { createContext, useContext, useState, useEffect } from 'react'
import { account } from '../config/appwrite'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getUserById, updateUser } from '../lib/users'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  const { data: user, isLoading: userLoading, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser', session?.$id],
    queryFn: async () => {
      const userDoc = await getUserById(session.$id)
      return userDoc
    },
    enabled: !!session?.$id,
    staleTime: 5 * 60 * 1000
  })

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const currentSession = await account.get()
      setSession(currentSession)
    } catch (error) {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password)
    await checkSession()
    queryClient.invalidateQueries(['currentUser'])
  }

  const logout = async () => {
    await account.deleteSession('current')
    setSession(null)
    queryClient.clear()
  }

  const register = async (email, password, name) => {
    await account.create('unique()', email, password, name)
    await login(email, password)
  }

  const value = {
    session,
    user,
    loading: loading || userLoading,
    isAuthenticated: !!session,
    login,
    logout,
    register,
    checkSession,
    refetchUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
