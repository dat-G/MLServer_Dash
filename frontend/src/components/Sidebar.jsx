import { Server, Plus, ChevronLeft, ChevronRight, Settings, X } from 'lucide-react'

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  selectedClientId,
  setSelectedClientId,
  remoteClients,
  handleServerSelect,
  setShowDownloadModal,
  APP_TITLE,
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left floating sidebar */}
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
        {/* Logo / Title area */}
        <div className={`${isSidebarOpen ? 'p-4 md:p-6' : 'p-4'} border-b border-gray-700/50`}>
          {/* Desktop: Logo + text */}
          <div className={`hidden md:flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div className={`${isSidebarOpen ? 'block' : 'hidden'} transition-opacity duration-200`}>
              <h1 className="text-lg font-bold text-white">{APP_TITLE}</h1>
              <p className="text-xs text-gray-400">Multi-Server Monitor</p>
            </div>
          </div>
          {/* Mobile: Close button */}
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

        {/* Server list */}
        <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2">
          <p className={`text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3 ${isSidebarOpen ? 'block' : 'hidden'}`}>
            服务器
          </p>

          {/* Local server */}
          <button
            onClick={() => {
              setSelectedClientId(null)
              setIsMobileMenuOpen(false)
            }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${!selectedClientId
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }
              ${!isSidebarOpen ? 'justify-center px-3' : ''}
            `}
            title={!isSidebarOpen ? 'Localhost' : undefined}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
            <Server className={`w-4 h-4 flex-shrink-0 ${!selectedClientId ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
            <span className={`flex-1 text-left text-sm font-medium truncate ${isSidebarOpen ? 'block' : 'hidden'}`}>
              Localhost
            </span>
            {!selectedClientId && isSidebarOpen && (
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          {/* Remote clients */}
          {remoteClients.map((client) => (
            <button
              key={client.server_id}
              onClick={() => {
                handleServerSelect(client.server_id)
                setIsMobileMenuOpen(false)
              }}
              disabled={client.status !== 'online'}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${selectedClientId === client.server_id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                }
                ${!isSidebarOpen ? 'justify-center px-3' : ''}
                ${client.status !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              title={!isSidebarOpen ? client.hostname : client.status !== 'online' ? '客户端离线' : undefined}
            >
              <span className={`
                w-2 h-2 rounded-full flex-shrink-0
                ${client.status === 'online'
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                  : 'bg-gray-500'
                }
                ${selectedClientId === client.server_id ? 'animate-pulse' : ''}
              `} />
              <Server className={`w-4 h-4 flex-shrink-0 ${selectedClientId === client.server_id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
              <span className={`flex-1 text-left text-sm font-medium truncate ${isSidebarOpen ? 'block' : 'hidden'}`}>
                {client.hostname}
              </span>
              {selectedClientId === client.server_id && isSidebarOpen && (
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>

        {/* Bottom actions */}
        <div className={`p-2 md:p-4 border-t border-gray-700/50 space-y-2 ${isSidebarOpen ? 'block' : 'flex flex-col items-center'}`}>
          {/* Download client button */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2' : 'justify-center'} px-4 py-2.5 rounded-xl bg-neon-blue/20 hover:bg-neon-blue/30 text-neon-blue border border-neon-blue/50 transition-all duration-200 text-sm font-medium`}
            title={!isSidebarOpen ? '下载客户端' : undefined}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>下载客户端</span>
          </button>

          {/* Collapse button */}
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

          {/* Settings button */}
          <button
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2' : 'justify-center'} px-4 py-2.5 rounded-xl bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200 text-sm font-medium`}
            title={!isSidebarOpen ? '设置' : undefined}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className={isSidebarOpen ? 'block' : 'hidden'}>设置</span>
          </button>
        </div>
      </aside>
    </>
  )
}
