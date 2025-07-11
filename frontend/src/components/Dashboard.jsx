import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Upload, Download, Trash2, Activity, Database } from 'lucide-react'
import { useSaves } from '../hooks/useSaves'
import { pathAPI, healthAPI } from '../utils/api'
import { formatFileSize, formatDate, formatGameDate } from '../utils/format'

const Dashboard = ({ notifications }) => {
  const { saves, loading } = useSaves()
  const [currentPath, setCurrentPath] = useState('')
  const [healthStatus, setHealthStatus] = useState(null)

  useEffect(() => {
    // 加载当前路径
    pathAPI.getCurrentPath().then(response => {
      if (response.success) {
        setCurrentPath(response.data.currentPath)
      }
    }).catch(err => {
      console.error('Failed to load current path:', err)
    })

    // 检查服务器健康状态
    healthAPI.check().then(response => {
      setHealthStatus('healthy')
    }).catch(err => {
      setHealthStatus('error')
    })
  }, [])

  // 计算统计信息
  const validSaves = saves.filter(save => save.isValid)
  const totalSize = saves.reduce((acc, save) => acc + (save.size || 0), 0)
  const newestSave = saves.length > 0 ? saves[0] : null
  const richestSave = validSaves.reduce((richest, save) => 
    save.money > (richest?.money || 0) ? save : richest, null)

  const stats = [
    {
      title: '存档总数',
      value: saves.length,
      icon: Database,
      color: 'bg-stardew-blue',
      detail: `${validSaves.length} 个有效存档`
    },
    {
      title: '总大小',
      value: formatFileSize(totalSize),
      icon: FolderOpen,
      color: 'bg-stardew-green',
      detail: '所有存档文件大小'
    },
    {
      title: '最新存档',
      value: newestSave?.name || '无',
      icon: Activity,
      color: 'bg-stardew-orange',
      detail: newestSave ? formatDate(newestSave.lastPlayed) : ''
    },
    {
      title: '最富有农场',
      value: richestSave?.farmName || '无',
      icon: Upload,
      color: 'bg-stardew-purple',
      detail: richestSave ? `${richestSave.playerName} - ${richestSave.money}g` : ''
    }
  ]

  const quickActions = [
    {
      title: '管理存档',
      description: '查看、导出、删除存档',
      icon: FolderOpen,
      link: '/saves',
      color: 'btn-primary'
    },
    {
      title: '设置路径',
      description: '配置存档目录路径',
      icon: Upload,
      link: '/path',
      color: 'btn-secondary'
    },
    {
      title: '查看日志',
      description: '查看操作历史记录',
      icon: Activity,
      link: '/logs',
      color: 'btn-secondary'
    }
  ]

  return (
    <div className="space-y-8">
      {/* 欢迎标题 */}
      <div className="text-center">
        <h1 className="text-pixel-2xl font-game text-stardew-brown text-shadow-pixel mb-2">
          欢迎使用星露谷物语存档管理器
        </h1>
        <p className="text-pixel-base font-game text-stardew-soil">
          管理你的农场存档，让游戏更轻松
        </p>
      </div>

      {/* 服务器状态 */}
      <div className="flex justify-center">
        <div className={`
          flex items-center space-x-2 px-4 py-2 rounded-pixel border-2
          ${healthStatus === 'healthy' 
            ? 'bg-stardew-green text-white border-green-700' 
            : 'bg-stardew-red text-white border-red-700'
          }
        `}>
          <div className={`w-2 h-2 rounded-full ${healthStatus === 'healthy' ? 'bg-white' : 'bg-red-200'}`}></div>
          <span className="font-game text-pixel-sm">
            服务器状态: {healthStatus === 'healthy' ? '正常' : '异常'}
          </span>
        </div>
      </div>

      {/* 当前存档路径 */}
      {currentPath && (
        <div className="card-pixel p-4">
          <h3 className="font-game text-pixel-base text-stardew-brown mb-2">当前存档路径</h3>
          <p className="font-game text-pixel-sm text-stardew-soil break-all bg-stardew-beige p-2 rounded-pixel border border-stardew-brown">
            {currentPath}
          </p>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card-pixel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-pixel ${stat.color} text-white shadow-pixel`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-game text-pixel-sm text-stardew-brown mb-1">
              {stat.title}
            </h3>
            <p className="font-game text-pixel-lg text-stardew-soil mb-2">
              {stat.value}
            </p>
            {stat.detail && (
              <p className="font-game text-pixel-xs text-stardew-lightbrown">
                {stat.detail}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 快速操作 */}
      <div className="card-pixel p-6">
        <h2 className="font-game text-pixel-lg text-stardew-brown mb-6 text-center">
          快速操作
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="block p-6 bg-stardew-beige border-2 border-stardew-brown rounded-pixel-lg hover:bg-stardew-wood transition-colors duration-200 shadow-pixel hover:shadow-pixel-lg"
            >
              <div className="text-center">
                <div className="inline-flex p-4 bg-stardew-cream rounded-pixel border-2 border-stardew-lightbrown mb-4">
                  <action.icon className="w-8 h-8 text-stardew-brown" />
                </div>
                <h3 className="font-game text-pixel-base text-stardew-brown mb-2">
                  {action.title}
                </h3>
                <p className="font-game text-pixel-sm text-stardew-soil">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 最近存档预览 */}
      {validSaves.length > 0 && (
        <div className="card-pixel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-game text-pixel-lg text-stardew-brown">
              最近的存档
            </h2>
            <Link to="/saves" className="btn-primary">
              查看全部
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validSaves.slice(0, 3).map((save) => (
              <div key={save.id} className="bg-stardew-beige border-2 border-stardew-lightbrown rounded-pixel p-4">
                <h4 className="font-game text-pixel-base text-stardew-brown mb-2">
                  {save.name}
                </h4>
                <div className="space-y-1 text-pixel-sm font-game text-stardew-soil">
                  <p>农场主: {save.playerName}</p>
                  <p>农场: {save.farmName}</p>
                  <p>日期: {formatGameDate(save.year, save.season, save.day)}</p>
                  <p>金钱: {save.money}g</p>
                  <p>游戏时间: {save.playTime}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-stardew-brown border-t-stardew-green rounded-full animate-spin"></div>
          <p className="font-game text-pixel-sm text-stardew-brown mt-2">加载中...</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard