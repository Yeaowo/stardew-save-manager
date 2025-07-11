import React, { useState } from 'react'
import { Download, Trash2, Upload, RefreshCw, CheckSquare, Square } from 'lucide-react'
import { useSaves } from '../hooks/useSaves'
import { formatFileSize, formatDate, formatGameDate, getSeasonColor } from '../utils/format'

const SaveList = ({ notifications }) => {
  const {
    saves,
    loading,
    error,
    selectedSaves,
    loadSaves,
    deleteSave,
    batchDeleteSaves,
    exportSave,
    batchExportSaves,
    toggleSelectSave,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
    hasSelection
  } = useSaves()

  const [showImportModal, setShowImportModal] = useState(false)

  const handleExport = async (id) => {
    const result = await exportSave(id)
    if (result.success) {
      notifications.showSuccess(result.message)
    } else {
      notifications.showError(result.error)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这个存档吗？')) {
      const result = await deleteSave(id)
      if (result.success) {
        notifications.showSuccess(result.message)
      } else {
        notifications.showError(result.error)
      }
    }
  }

  const handleBatchExport = async () => {
    const result = await batchExportSaves()
    if (result.success) {
      notifications.showSuccess(result.message)
    } else {
      notifications.showError(result.error)
    }
  }

  const handleBatchDelete = async () => {
    if (window.confirm(`确定要删除 ${selectedSaves.length} 个存档吗？`)) {
      const result = await batchDeleteSaves()
      if (result.success) {
        notifications.showSuccess(result.message)
      } else {
        notifications.showError(result.error)
      }
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-stardew-brown border-t-stardew-green rounded-full animate-spin"></div>
        <p className="font-game text-pixel-sm text-stardew-brown mt-2">加载存档中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-pixel p-6 text-center">
        <p className="font-game text-pixel-sm text-stardew-red mb-4">{error}</p>
        <button onClick={loadSaves} className="btn-primary">
          重新加载
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和操作栏 */}
      <div className="card-pixel p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-game text-pixel-xl text-stardew-brown mb-2">存档管理</h1>
            <p className="font-game text-pixel-sm text-stardew-soil">
              共 {saves.length} 个存档，已选择 {selectedSaves.length} 个
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={loadSaves} className="btn-secondary" disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              刷新
            </button>
            <button onClick={() => setShowImportModal(true)} className="btn-primary">
              <Upload className="w-4 h-4 mr-2" />
              导入存档
            </button>
            {hasSelection && (
              <>
                <button onClick={handleBatchExport} className="btn-secondary">
                  <Download className="w-4 h-4 mr-2" />
                  批量导出
                </button>
                <button onClick={handleBatchDelete} className="btn-danger">
                  <Trash2 className="w-4 h-4 mr-2" />
                  批量删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 存档列表 */}
      {saves.length === 0 ? (
        <div className="card-pixel p-8 text-center">
          <p className="font-game text-pixel-base text-stardew-soil mb-4">
            没有找到任何存档
          </p>
          <p className="font-game text-pixel-sm text-stardew-lightbrown mb-6">
            请检查存档路径设置，或导入一些存档文件
          </p>
          <button onClick={() => setShowImportModal(true)} className="btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            导入存档
          </button>
        </div>
      ) : (
        <div className="card-pixel p-6">
          {/* 表格头部 */}
          <div className="mb-4">
            <label className="flex items-center space-x-2 font-game text-pixel-sm text-stardew-brown">
              <button onClick={toggleSelectAll} className="flex items-center">
                {isAllSelected ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span>全选</span>
            </label>
          </div>

          {/* 存档表格 */}
          <div className="overflow-x-auto">
            <table className="table-pixel">
              <thead>
                <tr>
                  <th>选择</th>
                  <th>存档名</th>
                  <th>农场主</th>
                  <th>农场名</th>
                  <th>游戏日期</th>
                  <th>金钱</th>
                  <th>等级</th>
                  <th>游戏时间</th>
                  <th>大小</th>
                  <th>最后修改</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {saves.map((save) => (
                  <tr key={save.id}>
                    <td>
                      <button onClick={() => toggleSelectSave(save.id)}>
                        {selectedSaves.includes(save.id) ? (
                          <CheckSquare className="w-4 h-4 text-stardew-green" />
                        ) : (
                          <Square className="w-4 h-4 text-stardew-lightbrown" />
                        )}
                      </button>
                    </td>
                    <td>
                      <div>
                        <span className="font-semibold">{save.name}</span>
                        {!save.isValid && (
                          <span className="badge-error ml-2">无效</span>
                        )}
                      </div>
                    </td>
                    <td>{save.playerName || '-'}</td>
                    <td>{save.farmName || '-'}</td>
                    <td>
                      {save.isValid ? (
                        <span className={getSeasonColor(save.season)}>
                          {formatGameDate(save.year, save.season, save.day)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{save.isValid ? `${save.money}g` : '-'}</td>
                    <td>{save.isValid ? save.level : '-'}</td>
                    <td>{save.isValid ? save.playTime : '-'}</td>
                    <td>{formatFileSize(save.size)}</td>
                    <td>{formatDate(save.lastPlayed)}</td>
                    <td>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleExport(save.id)}
                          className="p-1 bg-stardew-blue text-white rounded-pixel hover:bg-blue-600"
                          title="导出"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(save.id)}
                          className="p-1 bg-stardew-red text-white rounded-pixel hover:bg-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 导入模态框占位符 */}
      {showImportModal && (
        <div className="modal-pixel">
          <div className="modal-content">
            <h3 className="font-game text-pixel-lg text-stardew-brown mb-4">导入存档</h3>
            <p className="font-game text-pixel-sm text-stardew-soil mb-4">
              导入功能开发中...
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowImportModal(false)} className="btn-secondary">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SaveList