import { Activity, Clock, RefreshCw, Rss, Server } from 'lucide-react'

export default function DashboardHeader({
  currentDisplay,
  displayInfo,
  distroName,
  lastUpdate,
  wsConnected,
  wsClientCount,
  APP_TITLE,
}) {
  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            <Server className="inline-block w-8 h-8 mr-2 text-neon-blue" />
            {currentDisplay.isLocal ? APP_TITLE : (currentDisplay.clientInfo?.hostname || 'Remote Server')}
          </h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-400 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span className="font-mono">{displayInfo?.hostname}</span>
              </span>
              <span>|</span>
              <span className="text-white font-medium font-mono">{currentDisplay.isLocal ? (distroName || displayInfo?.os) : displayInfo?.os}</span>
              {!currentDisplay.isLocal && (
                <>
                  <span>|</span>
                  <span className="text-neon-blue font-medium text-sm">远程</span>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 text-gray-400">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{lastUpdate?.toLocaleTimeString()}</span>
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="font-mono">
                  {String(Math.floor(displayInfo?.uptime / 3600)).padStart(2, '0')}:
                  {String(Math.floor((displayInfo?.uptime % 3600) / 60)).padStart(2, '0')}:
                  {String(displayInfo?.uptime % 60).padStart(2, '0')}
                </span>
              </span>
            </div>
            <span className={`flex items-center gap-1 ${wsConnected ? 'text-neon-green' : 'text-gray-500'}`} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}>
              <Rss className={`w-4 h-4 ${wsConnected ? '' : 'opacity-50'}`} />
              <span className="font-mono text-sm">({wsClientCount})</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
