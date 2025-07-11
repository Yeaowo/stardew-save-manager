import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import SaveList from './components/SaveList'
import PathManager from './components/PathManager'
import Logs from './components/Logs'
import ImportModal from './components/ImportModal'
import NotificationContainer from './components/NotificationContainer'
import { useNotifications } from './hooks/useNotifications'

const MainApp = () => {
  const notifications = useNotifications()

  return (
    <div className="min-h-screen bg-gradient-to-b from-stardew-sky to-stardew-grass">
      {/* 背景装饰 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-16 h-16 bg-stardew-yellow rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-32 right-20 w-12 h-12 bg-stardew-orange rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-stardew-green rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-32 right-1/3 w-14 h-14 bg-stardew-purple rounded-full opacity-20 animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* 主要内容 */}
      <div className="relative z-10">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard notifications={notifications} />} />
            <Route path="/saves" element={<SaveList notifications={notifications} />} />
            <Route path="/path" element={<PathManager notifications={notifications} />} />
            <Route path="/logs" element={<Logs notifications={notifications} />} />
          </Routes>
        </main>
      </div>

      {/* 通知容器 */}
      <NotificationContainer notifications={notifications} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <MainApp />
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  )
}

export default App