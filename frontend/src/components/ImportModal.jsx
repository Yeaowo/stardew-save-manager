import React from 'react'

const ImportModal = ({ isOpen, onClose, notifications }) => {
  if (!isOpen) return null

  return (
    <div className="modal-pixel">
      <div className="modal-content">
        <h3 className="font-game text-pixel-lg text-stardew-brown mb-4">导入存档</h3>
        <p className="font-game text-pixel-sm text-stardew-soil mb-4">
          导入功能正在开发中，敬请期待...
        </p>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="btn-secondary">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal