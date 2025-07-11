import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, FolderOpen, Settings, FileText, Sprout } from 'lucide-react'

const Header = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/saves', icon: FolderOpen, label: '存档管理' },
    { path: '/path', icon: Settings, label: '路径设置' },
    { path: '/logs', icon: FileText, label: '操作日志' }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <header className="bg-stardew-brown border-b-4 border-stardew-soil shadow-pixel-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo和标题 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-stardew-green rounded-pixel flex items-center justify-center border-2 border-stardew-darkgreen shadow-pixel">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-pixel-lg font-game text-stardew-cream text-shadow-pixel">
                星露谷物语
              </h1>
              <p className="text-pixel-xs font-game text-stardew-beige">
                存档管理器
              </p>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex space-x-1">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-pixel border-2 transition-all duration-150
                  font-game text-pixel-sm
                  ${isActive(path)
                    ? 'bg-stardew-cream text-stardew-brown border-stardew-darkgreen shadow-pixel-inset'
                    : 'bg-stardew-lightbrown text-stardew-cream border-stardew-brown hover:bg-stardew-wood hover:shadow-pixel'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* 装饰性边框 */}
      <div className="h-1 bg-gradient-to-r from-stardew-green via-stardew-yellow to-stardew-green opacity-50"></div>
    </header>
  )
}

export default Header