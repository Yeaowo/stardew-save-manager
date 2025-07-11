import React from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const NotificationContainer = ({ notifications }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-stardew-green text-white border-green-700'
      case 'error':
        return 'bg-stardew-red text-white border-red-700'
      case 'warning':
        return 'bg-stardew-orange text-white border-orange-700'
      default:
        return 'bg-stardew-blue text-white border-blue-700'
    }
  }

  if (!notifications.notifications || notifications.notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            notification-pixel p-4 max-w-sm w-full
            flex items-start space-x-3
            border-2 shadow-pixel
            transform transition-all duration-300 ease-in-out
            animate-in slide-in-from-right
            ${getStyles(notification.type)}
          `}
        >
          <div className="flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-game text-pixel-sm break-words">
              {notification.message}
            </p>
          </div>

          <button
            onClick={() => notifications.removeNotification(notification.id)}
            className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-20 rounded-pixel transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default NotificationContainer