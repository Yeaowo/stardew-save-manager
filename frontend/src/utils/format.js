import { SEASON_NAMES, OPERATION_NAMES } from '../types/index.js'

// 格式化文件大小
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化金钱
export const formatMoney = (amount) => {
  if (amount === undefined || amount === null) return '0g'
  return new Intl.NumberFormat('zh-CN').format(amount) + 'g'
}

// 格式化日期
export const formatDate = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化相对时间
export const formatRelativeTime = (dateString) => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  
  const now = new Date()
  const diffMs = now - date
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  
  return formatDate(dateString)
}

// 格式化游戏日期
export const formatGameDate = (year, season, day) => {
  if (!year || !season || !day) return ''
  
  const seasonName = SEASON_NAMES[season] || season
  return `${year}年 ${seasonName} ${day}日`
}

// 格式化操作类型
export const formatOperation = (operation) => {
  return OPERATION_NAMES[operation] || operation
}

// 生成随机ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9)
}

// 下载文件
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// 复制到剪贴板
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (e) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// 验证文件类型
export const validateFileType = (file, allowedTypes = ['application/zip', 'application/x-zip-compressed']) => {
  return allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.zip')
}

// 验证文件大小
export const validateFileSize = (file, maxSize = 100 * 1024 * 1024) => { // 默认100MB
  return file.size <= maxSize
}

// 延迟函数
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 防抖函数
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深度比较对象
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true
  
  if (obj1 == null || obj2 == null) return false
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }
  
  return true
}

// 获取季节颜色
export const getSeasonColor = (season) => {
  const colors = {
    spring: 'text-green-600',
    summer: 'text-yellow-600',
    fall: 'text-orange-600',
    winter: 'text-blue-600'
  }
  return colors[season] || 'text-gray-600'
}

// 获取存档状态徽章样式
export const getSaveStatusBadge = (save) => {
  if (!save.isValid) return 'badge-error'
  if (save.money > 1000000) return 'badge-success'
  if (save.level > 5) return 'badge-warning'
  return 'badge-pixel'
}