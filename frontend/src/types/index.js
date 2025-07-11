// 存档信息类型定义
export const SaveInfo = {
  id: '',
  name: '',
  playerName: '',
  farmName: '',
  money: 0,
  level: 0,
  day: 0,
  season: '',
  year: 0,
  playTime: '',
  lastPlayed: '',
  size: 0,
  path: '',
  isValid: false,
  error: ''
}

// 路径配置类型定义
export const PathConfig = {
  currentPath: '',
  recentPaths: [],
  isValid: false,
  error: ''
}

// 操作日志类型定义
export const OperationLog = {
  id: '',
  timestamp: '',
  operation: '',
  details: '',
  success: false,
  error: ''
}

// API响应类型定义
export const APIResponse = {
  success: false,
  message: '',
  data: null,
  error: ''
}

// 季节显示映射
export const SEASON_NAMES = {
  'spring': '春',
  'summer': '夏', 
  'fall': '秋',
  'winter': '冬'
}

// 操作类型映射
export const OPERATION_NAMES = {
  'import': '导入存档',
  'export': '导出存档',
  'delete': '删除存档',
  'batch_export': '批量导出',
  'batch_delete': '批量删除',
  'path_change': '切换路径'
}