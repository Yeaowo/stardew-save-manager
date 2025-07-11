import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(Cookies.get('token'))

  // 设置axios默认认证头
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      Cookies.set('token', token, { expires: 7 }) // 7天过期
    } else {
      delete axios.defaults.headers.common['Authorization']
      Cookies.remove('token')
    }
  }

  // 登录
  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      })
      
      const { token, user } = response.data
      setToken(token)
      setUser(user)
      setAuthToken(token)
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || '登录失败' 
      }
    }
  }

  // 注册
  const register = async (username, password, email) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        password,
        email
      })
      
      const { token, user } = response.data
      setToken(token)
      setUser(user)
      setAuthToken(token)
      
      return { success: true }
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        error: error.response?.data?.message || '注册失败' 
      }
    }
  }

  // 登出
  const logout = () => {
    setToken(null)
    setUser(null)
    setAuthToken(null)
  }

  // 验证token
  const verifyToken = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setAuthToken(token)
      const response = await axios.get('/api/auth/verify')
      setUser(response.data.user)
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifyToken()
  }, [])

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}