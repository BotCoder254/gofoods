import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Loader from './components/common/Loader'

// Layouts
import MainLayout from './components/layout/MainLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Main Pages
import Feed from './pages/feed/Feed'
import Profile from './pages/profile/Profile'
import ProfileEdit from './pages/profile/ProfileEdit'
import FoodDetail from './pages/posts/FoodDetail'
import MapView from './pages/map/MapView'
import Requests from './pages/requests/Requests'
import Chat from './pages/messages/Chat'
import Bookmarks from './pages/bookmarks/Bookmarks'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Loader fullScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="food/:id" element={<FoodDetail />} />
          <Route path="map" element={<MapView />} />
          <Route path="requests" element={<Requests />} />
          <Route path="chat/:requestId" element={<Chat />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
