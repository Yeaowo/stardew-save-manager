import { useState, useCallback } from 'react'
import { generateId } from '../utils/format.js'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])

  // 添加通知
  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = generateId()
    const notification = {
      id,
      message,
      type, // success, error, warning, info
      duration,
      timestamp: new Date()
    }

    setNotifications(prev => [...prev, notification])

    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }, [])

  // 移除通知
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  // 清空所有通知
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // 快捷方法
  const showSuccess = useCallback((message, duration) => {
    return addNotification(message, 'success', duration)
  }, [addNotification])

  const showError = useCallback((message, duration) => {
    return addNotification(message, 'error', duration)
  }, [addNotification])

  const showWarning = useCallback((message, duration) => {
    return addNotification(message, 'warning', duration)
  }, [addNotification])

  const showInfo = useCallback((message, duration) => {
    return addNotification(message, 'info', duration)
  }, [addNotification])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}