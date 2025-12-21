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
import ProfileEdit from './pages/profile/ProfileEdit'
import FoodDetail from './pages/posts/FoodDetail'
import MapView from './pages/map/MapView'
import Requests from './pages/requests/Requests'
import Chat from './pages/messages/Chat'

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
          <Route path="profile/edit" element={<ProfileEdit />} />
          <Route path="map" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Map View - Coming Soon</h2></div>} />
          <Route path="create" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Create Post - Coming Soon</h2></div>} />
          <Route path="messages" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Messages - Coming Soon</h2></div>} />
          <Route path="bookmarks" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Bookmarks - Coming Soon</h2></div>} />
          <Route path="profile" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Profile View - Coming Soon</h2></div>} />
          <Route path="admin" element={<div className="text-center py-20"><h2 className="text-2xl font-bold">Admin Panel - Coming Soon</h2></div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
