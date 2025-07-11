import React, { useState, useEffect } from 'react'
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { logAPI } from '../utils/api'
import { formatDate, formatOperation } from '../utils/format'

const Logs = ({ notifications }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize] = useState(20)

  useEffect(() => {
    loadLogs()
  }, [currentPage])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await logAPI.getLogs(currentPage, pageSize)
      if (response.success) {
        setLogs(response.data.logs || [])
        setTotalPages(Math.ceil(response.data.total / pageSize))
      } else {
        notifications.showError('加载日志失败')
      }
    } catch (err) {
      notifications.showError('加载日志失败')
    } finally {
      setLoading(false)
    }
  }

  const getOperationColor = (operation) => {
    switch (operation) {
      case 'import':
        return 'text-stardew-green'
      case 'export':
      case 'batch_export':
        return 'text-stardew-blue'
      case 'delete':
      case 'batch_delete':
        return 'text-stardew-red'
      case 'path_change':
        return 'text-stardew-orange'
      default:
        return 'text-stardew-soil'
    }
  }

  const getStatusBadge = (success) => {
    return success ? 'badge-success' : 'badge-error'
  }

  return (
    <div className="space-y-6">
      <div className="card-pixel p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-game text-pixel-xl text-stardew-brown mb-2">操作日志</h1>
            <p className="font-game text-pixel-sm text-stardew-soil">
              查看所有存档管理操作的历史记录
            </p>
          </div>
          
          <button onClick={loadLogs} className="btn-secondary" disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </button>
        </div>

        {loading && logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-stardew-brown border-t-stardew-green rounded-full animate-spin"></div>
            <p className="font-game text-pixel-sm text-stardew-brown mt-2">加载日志中...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="font-game text-pixel-base text-stardew-soil">暂无操作日志</p>
          </div>
        ) : (
          <>
            {/* 日志列表 */}
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-stardew-beige border border-stardew-lightbrown rounded-pixel p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`font-game text-pixel-sm font-semibold ${getOperationColor(log.operation)}`}>
                          {formatOperation(log.operation)}
                        </span>
                        <span className={getStatusBadge(log.success)}>
                          {log.success ? '成功' : '失败'}
                        </span>
                      </div>
                      
                      <p className="font-game text-pixel-sm text-stardew-soil mb-2">
                        {log.details}
                      </p>
                      
                      {log.error && (
                        <p className="font-game text-pixel-xs text-stardew-red bg-red-50 p-2 rounded-pixel border border-red-200">
                          错误: {log.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-game text-pixel-xs text-stardew-lightbrown">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 分页控制 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </button>
                
                <span className="font-game text-pixel-sm text-stardew-brown">
                  第 {currentPage} 页，共 {totalPages} 页
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Logs