import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import Login from './Login'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stardew-sky to-stardew-grass flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-stardew-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? children : <Login />
}

export default ProtectedRoute