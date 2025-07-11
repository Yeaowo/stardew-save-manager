import { useState, useEffect, useCallback } from 'react'
import { saveAPI } from '../utils/api.js'

export const useSaves = () => {
  const [saves, setSaves] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSaves, setSelectedSaves] = useState([])

  // 加载存档列表
  const loadSaves = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await saveAPI.getSaves()
      if (response.success) {
        setSaves(response.data || [])
      } else {
        setError(response.error || '加载存档列表失败')
      }
    } catch (err) {
      setError(err.error || '网络错误')
    } finally {
      setLoading(false)
    }
  }, [])

  // 删除存档
  const deleteSave = useCallback(async (id) => {
    try {
      const response = await saveAPI.deleteSave(id)
      if (response.success) {
        setSaves(prev => prev.filter(save => save.id !== id))
        setSelectedSaves(prev => prev.filter(saveId => saveId !== id))
        return { success: true, message: response.message }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err.error || '删除失败' }
    }
  }, [])

  // 批量删除存档
  const batchDeleteSaves = useCallback(async (saveIds = selectedSaves) => {
    if (saveIds.length === 0) {
      return { success: false, error: '请选择要删除的存档' }
    }

    try {
      const response = await saveAPI.batchDelete(saveIds)
      if (response.success) {
        setSaves(prev => prev.filter(save => !saveIds.includes(save.id)))
        setSelectedSaves([])
        return { success: true, message: response.message }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err.error || '批量删除失败' }
    }
  }, [selectedSaves])

  // 导出存档
  const exportSave = useCallback(async (id) => {
    try {
      const response = await saveAPI.exportSave(id)
      const save = saves.find(s => s.id === id)
      const filename = save ? `${save.name}_export.zip` : 'save_export.zip'
      
      // 下载文件
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true, message: '存档导出成功' }
    } catch (err) {
      return { success: false, error: err.error || '导出失败' }
    }
  }, [saves])

  // 批量导出存档
  const batchExportSaves = useCallback(async (saveIds = selectedSaves) => {
    if (saveIds.length === 0) {
      return { success: false, error: '请选择要导出的存档' }
    }

    try {
      const response = await saveAPI.batchExport(saveIds)
      const filename = `stardew_saves_batch_${new Date().getTime()}.zip`
      
      // 下载文件
      const url = window.URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true, message: '批量导出成功' }
    } catch (err) {
      return { success: false, error: err.error || '批量导出失败' }
    }
  }, [selectedSaves])

  // 导入存档
  const importSave = useCallback(async (file, options = {}) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options.overwriteExisting !== undefined) {
      formData.append('overwriteExisting', options.overwriteExisting.toString())
    }
    if (options.backupExisting !== undefined) {
      formData.append('backupExisting', options.backupExisting.toString())
    }

    try {
      const response = await saveAPI.importSave(formData)
      if (response.success) {
        // 重新加载存档列表
        await loadSaves()
        return { success: true, message: response.message, data: response.data }
      } else {
        return { success: false, error: response.error }
      }
    } catch (err) {
      return { success: false, error: err.error || '导入失败' }
    }
  }, [loadSaves])

  // 切换选中状态
  const toggleSelectSave = useCallback((id) => {
    setSelectedSaves(prev => {
      if (prev.includes(id)) {
        return prev.filter(saveId => saveId !== id)
      } else {
        return [...prev, id]
      }
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedSaves.length === saves.length) {
      setSelectedSaves([])
    } else {
      setSelectedSaves(saves.map(save => save.id))
    }
  }, [saves, selectedSaves])

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedSaves([])
  }, [])

  // 初始加载
  useEffect(() => {
    loadSaves()
  }, [loadSaves])

  return {
    saves,
    loading,
    error,
    selectedSaves,
    loadSaves,
    deleteSave,
    batchDeleteSaves,
    exportSave,
    batchExportSaves,
    importSave,
    toggleSelectSave,
    toggleSelectAll,
    clearSelection,
    isAllSelected: selectedSaves.length === saves.length && saves.length > 0,
    hasSelection: selectedSaves.length > 0
  }
}