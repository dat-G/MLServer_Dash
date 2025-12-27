import { useState, useEffect } from 'react'
import { Server, Layers, Settings, Cpu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import ServerDashboard from './components/ServerDashboard'
import configJson from '../../config.json'

const APP_TITLE = configJson.app.appName
const GITHUB_URL = configJson.app.githubUrl
const API_BASE = '/api'

function App() {
  // 服务器列表状态
  const [servers, setServers] = useState([])
  const [activeServerId, setActiveServerId] = useState(null)

  // 加载服务器列表
  useEffect(() => {
    fetchServers()
  }, [])

  // 获取服务器列表
  const fetchServers = async () => {
    try {
      const response = await fetch(`${API_BASE}/servers`)
      const data = await response.json()
      // 转换 API 格式到前端格式
      const transformedServers = data.servers.map(s => ({
        id: s.id,
        name: s.name,
        url: `http://${s.host}:${s.port}`,
        status: s.status,
      }))
      setServers(transformedServers)

      // 如果没有选中的服务器，默认选中第一个
      if (transformedServers.length > 0 && !activeServerId) {
        setActiveServerId(transformedServers[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch servers:', error)
    }
  }

  // Sidebar 状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)  // 桌面端：展开/折叠
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)  // 移动端：菜单开关

  // 获取当前活跃的服务器
  const activeServer = servers.find(s => s.id === activeServerId)

  return (
    <div className="flex flex-row h-screen bg-cyber-black overflow-hidden">
      {/* 移动端背景遮罩 */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 左侧悬浮导航栏 */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:z-0
          h-[calc(100vh-1rem)] m-2 md:h-[calc(100vh-2rem)] md:m-4
          rounded-3xl
          bg-gray-800/60 backdrop-blur-md
          border border-gray-700/50 shadow-2xl
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        {/* Logo / 标题区域 */}
        <div className={`${isSidebarOpen ? 'p-4 md:p-6' : 'p-4'} border-b border-gray-700/50`}>
          {/* 桌面端：Logo + 文字 */}
          <div className={`hidden md:flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} transition-opacity duration-200`}>
              <h1 className="text-lg font-bold text-white">{APP_TITLE}</h1>
              <p className="text-xs text-gray-400">Multi-Server Monitor</p>
            </div>
          </div>
          {/* 移动端：关闭按钮 */}
          <div className="md:hidden flex items-center justify-between">
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} transition-opacity duration-200`}>
              <h1 className="text-lg font-bold text-white">{APP_TITLE}</h1>
              <p className="text-xs text-gray-400">Multi-Server Monitor</p>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center hover:bg-gray-700 transition-colors flex-shrink-0"
              title="关闭菜单"
            >
              <X className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </div>

        {/* 服务器列表 */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
          <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>
            Servers ({servers.length})
          </p>

          {servers.map((server) => (
            <button
              key={server.id}
              onClick={() => {
                setActiveServerId(server.id)
                setIsMobileMenuOpen(false)  // 移动端选择后关闭菜单
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${activeServerId === server.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }
                ${!isSidebarOpen ? 'justify-center px-3' : ''}
              `}
              title={!isSidebarOpen ? server.name : undefined}
            >
              {/* 状态指示点 */}
              <span className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${server.status === 'online'
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                  : 'bg-gray-500'
                }
                ${activeServerId === server.id ? 'animate-pulse' : ''}
              `} />

              {/* 图标 */}
              <Cpu className={`
                w-4 h-4 flex-shrink-0
                ${activeServerId === server.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}
              `} />

              {/* 服务器名称 - 折叠时隐藏 */}
              <span className={`flex-1 text-left text-sm font-medium truncate ${isSidebarOpen ? 'block' : 'hidden'}`}>
                {server.name}
              </span>

              {/* 选中指示器 - 折叠时隐藏 */}
              {activeServerId === server.id && isSidebarOpen && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* 底部操作区 */}
        <div className={`p-2 md:p-4 border-t border-gray-700/50 space-y-2 ${isSidebarOpen ? 'block' : 'flex flex-col items-center'}`}>
          {/* 折叠按钮 - 移动端和桌面端都显示 */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center ${isSidebarOpen ? 'justify-center gap-2' : 'justify-center'} w-full px-4 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium`}
            title={isSidebarOpen ? '折叠侧边栏' : '展开侧边栏'}
          >
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                <span>折叠</span>
              </>
            ) : (
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            )}
          </button>

          {/* 设置按钮 */}
          <button
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2' : 'justify-center'} px-4 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium`}
            title={!isSidebarOpen ? '设置' : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>设置</span>
          </button>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 my-2 md:my-4 mx-2 md:mx-0 md:mr-4 rounded-2xl md:rounded-3xl bg-cyber-card border border-cyber-border overflow-hidden flex flex-col">
        {/* 移动端展开菜单按钮 */}
        <div className="md:hidden p-4 flex items-center gap-3 border-b border-cyber-border flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-gray-700/50 flex items-center justify-center hover:bg-gray-700 transition-colors"
            title="打开菜单"
          >
            <ChevronRight className="w-6 h-6 text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Server className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold text-white">{APP_TITLE}</span>
          </div>
        </div>

        {/* 服务器内容 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto">
          {activeServer ? (
            <ServerDashboard
              key={activeServer.id}
              serverUrl={activeServer.url}
              serverName={activeServer.name}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">请选择一个服务器</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
