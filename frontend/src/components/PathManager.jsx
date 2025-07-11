import React, { useState, useEffect } from 'react'
import { FolderOpen, Check, AlertCircle } from 'lucide-react'
import { pathAPI } from '../utils/api'

const PathManager = ({ notifications }) => {
  const [currentPath, setCurrentPath] = useState('')
  const [newPath, setNewPath] = useState('')
  const [recentPaths, setRecentPaths] = useState([])
  const [isValid, setIsValid] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCurrentPath()
  }, [])

  const loadCurrentPath = async () => {
    try {
      const response = await pathAPI.getCurrentPath()
      if (response.success) {
        setCurrentPath(response.data.currentPath)
        setNewPath(response.data.currentPath)
        setRecentPaths(response.data.recentPaths || [])
        setIsValid(response.data.isValid)
      }
    } catch (err) {
      notifications.showError('加载路径配置失败')
    }
  }

  const validatePath = async (path) => {
    if (!path) return false
    
    try {
      const response = await pathAPI.validatePath(path)
      return response.success && response.data.valid
    } catch (err) {
      return false
    }
  }

  const handlePathChange = async (e) => {
    const path = e.target.value
    setNewPath(path)
    
    if (path) {
      const valid = await validatePath(path)
      setIsValid(valid)
    } else {
      setIsValid(false)
    }
  }

  const handleSavePath = async () => {
    if (!newPath || !isValid) return
    
    setLoading(true)
    try {
      const response = await pathAPI.setPath(newPath)
      if (response.success) {
        setCurrentPath(newPath)
        setRecentPaths(response.data.recentPaths || [])
        notifications.showSuccess('路径设置成功')
      } else {
        notifications.showError(response.error || '设置路径失败')
      }
    } catch (err) {
      notifications.showError('设置路径失败')
    } finally {
      setLoading(false)
    }
  }

  const selectRecentPath = (path) => {
    setNewPath(path)
    validatePath(path).then(setIsValid)
  }

  return (
    <div className="space-y-6">
      <div className="card-pixel p-6">
        <h1 className="font-game text-pixel-xl text-stardew-brown mb-6">路径设置</h1>
        
        {/* 当前路径 */}
        <div className="mb-6">
          <h3 className="font-game text-pixel-base text-stardew-brown mb-3">当前存档路径</h3>
          <div className="bg-stardew-beige border-2 border-stardew-brown rounded-pixel p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-stardew-soil" />
              <span className="font-game text-pixel-sm text-stardew-soil break-all">
                {currentPath || '未设置'}
              </span>
              {isValid && currentPath === newPath && (
                <Check className="w-5 h-5 text-stardew-green" />
              )}
            </div>
          </div>
        </div>

        {/* 设置新路径 */}
        <div className="mb-6">
          <h3 className="font-game text-pixel-base text-stardew-brown mb-3">设置新路径</h3>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={newPath}
                onChange={handlePathChange}
                placeholder="输入存档目录路径..."
                className={`input-pixel w-full pr-10 ${
                  newPath ? (isValid ? 'border-stardew-green' : 'border-stardew-red') : ''
                }`}
              />
              {newPath && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValid ? (
                    <Check className="w-5 h-5 text-stardew-green" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-stardew-red" />
                  )}
                </div>
              )}
            </div>
            
            {newPath && !isValid && (
              <p className="font-game text-pixel-xs text-stardew-red">
                路径无效或不可访问
              </p>
            )}
            
            <button
              onClick={handleSavePath}
              disabled={!newPath || !isValid || loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '保存中...' : '保存路径'}
            </button>
          </div>
        </div>

        {/* 最近使用的路径 */}
        {recentPaths.length > 0 && (
          <div>
            <h3 className="font-game text-pixel-base text-stardew-brown mb-3">最近使用的路径</h3>
            <div className="space-y-2">
              {recentPaths.map((path, index) => (
                <button
                  key={index}
                  onClick={() => selectRecentPath(path)}
                  className="w-full text-left p-3 bg-stardew-beige border border-stardew-lightbrown rounded-pixel hover:bg-stardew-wood transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-stardew-soil flex-shrink-0" />
                    <span className="font-game text-pixel-sm text-stardew-soil break-all">
                      {path}
                    </span>
                    {path === currentPath && (
                      <span className="badge-success">当前</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 帮助信息 */}
      <div className="card-pixel p-6">
        <h3 className="font-game text-pixel-base text-stardew-brown mb-3">使用说明</h3>
        <div className="space-y-2 font-game text-pixel-sm text-stardew-soil">
          <p>• 存档路径应该指向包含星露谷物语存档文件夹的目录</p>
          <p>• 每个存档通常是一个以玩家名命名的文件夹</p>
          <p>• 常见路径：</p>
          <ul className="ml-4 space-y-1 text-pixel-xs">
            <li>Windows: %APPDATA%/StardewValley/Saves</li>
            <li>Mac: ~/.config/StardewValley/Saves</li>
            <li>Linux: ~/.config/StardewValley/Saves</li>
          </ul>
          <p>• 路径必须存在且可读写才能正常使用</p>
        </div>
      </div>
    </div>
  )
}

export default PathManager