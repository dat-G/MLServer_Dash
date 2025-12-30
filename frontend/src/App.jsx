import { useState, useEffect, useRef } from 'react'
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Clock,
  RefreshCw,
  Layers,
  Zap,
  Network,
  EthernetPort,
  Rss,
  Plus,
  X,
  Copy,
  Check,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { Gpu } from 'lucide-react'
import configJson from '../../config.json'

const APP_TITLE = configJson.app.appName
const GITHUB_URL = configJson.app.githubUrl
const API_BASE = '/api'
const HISTORY_SIZE = configJson.server.historySize || 30

// Color constants
const COLORS = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
}

// Get line color based on percent
const getLineColor = (percent) => {
  if (percent >= 80) return COLORS.red
  if (percent >= 60) return COLORS.yellow
  if (percent >= 40) return COLORS.blue
  return COLORS.green
}

// Memory Sparkline Component
function MemorySparkline({ currentPercent, history }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.clientWidth * 2
    const height = canvas.height = canvas.clientHeight * 2
    ctx.scale(2, 2)

    const displayWidth = width / 2
    const displayHeight = height / 2
    const padding = 2
    const chartHeight = displayHeight - padding * 2
    const chartWidth = displayWidth - padding * 2

    ctx.clearRect(0, 0, displayWidth, displayHeight)

    if (history.length < 2) return

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = COLORS.green
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const step = chartWidth / (history.length - 1)
    const startIdx = Math.max(0, history.length - HISTORY_SIZE)

    history.slice(startIdx).forEach((percent, i) => {
      const x = padding + i * step
      const y = padding + chartHeight - (percent / 100) * chartHeight
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Fill area under line
    ctx.lineTo(padding + (history.length - startIdx - 1) * step, displayHeight - padding)
    ctx.lineTo(padding, displayHeight - padding)
    ctx.closePath()
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'
    ctx.fill()

    // Draw current value dot
    const lastPercent = history[history.length - 1]
    const lastX = padding + (history.length - startIdx - 1) * step
    const lastY = padding + chartHeight - (lastPercent / 100) * chartHeight

    ctx.beginPath()
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.green
    ctx.fill()

    // Glow effect
    ctx.beginPath()
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(lastX, lastY, 0, lastX, lastY, 8)
    gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)')
    gradient.addColorStop(1, 'rgba(34, 197, 94, 0)')
    ctx.fillStyle = gradient
    ctx.fill()

  }, [history])

  return <canvas ref={canvasRef} className="w-full h-16" />
}

// Network Sparkline Component
function NetworkSparkline({ interfaceName, speedUp, speedDown, historyUp, historyDown }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.clientWidth * 2
    const height = canvas.height = canvas.clientHeight * 2
    ctx.scale(2, 2)

    const displayWidth = width / 2
    const displayHeight = height / 2
    const padding = 2
    const chartHeight = displayHeight / 2 - padding * 2
    const chartWidth = displayWidth - padding * 2

    ctx.clearRect(0, 0, displayWidth, displayHeight)

    // Draw upload line (top half - blue)
    if (historyUp.length >= 2) {
      const maxUp = Math.max(...historyUp, 1)
      ctx.beginPath()
      ctx.strokeStyle = COLORS.blue
      ctx.lineWidth = 1.5

      const step = chartWidth / (historyUp.length - 1)
      const startIdx = Math.max(0, historyUp.length - HISTORY_SIZE)

      historyUp.slice(startIdx).forEach((val, i) => {
        const x = padding + i * step
        const y = padding + chartHeight - (val / maxUp) * chartHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // Draw download line (bottom half - green)
    if (historyDown.length >= 2) {
      const maxDown = Math.max(...historyDown, 1)
      ctx.beginPath()
      ctx.strokeStyle = COLORS.green
      ctx.lineWidth = 1.5

      const step = chartWidth / (historyDown.length - 1)
      const startIdx = Math.max(0, historyDown.length - HISTORY_SIZE)
      const bottomY = displayHeight / 2 + padding

      historyDown.slice(startIdx).forEach((val, i) => {
        const x = padding + i * step
        const y = bottomY + chartHeight - (val / maxDown) * chartHeight
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    }

    // Label
    ctx.font = '10px monospace'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText('UP', padding, padding + 8)
    ctx.fillText('DOWN', padding, displayHeight / 2 + padding + 8)

  }, [historyUp, historyDown])

  return <canvas ref={canvasRef} className="w-full h-20" />
}

// Core Square Component (single core with sparkline)
function CoreSquare({ index, currentPercent, history, color }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.clientWidth * 2
    const height = canvas.height = canvas.clientHeight * 2
    ctx.scale(2, 2)

    const displayWidth = width / 2
    const displayHeight = height / 2
    const padding = 2

    ctx.clearRect(0, 0, displayWidth, displayHeight)

    if (history.length < 2) return

    const chartWidth = displayWidth - padding * 2
    const chartHeight = displayHeight - padding * 2

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5

    const step = chartWidth / (history.length - 1)
    const startIdx = Math.max(0, history.length - HISTORY_SIZE)

    history.slice(startIdx).forEach((percent, i) => {
      const x = padding + i * step
      const y = padding + chartHeight - (percent / 100) * chartHeight
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // Current value dot
    const lastPercent = history[history.length - 1]
    const lastX = padding + (history.length - startIdx - 1) * step
    const lastY = padding + chartHeight - (lastPercent / 100) * chartHeight

    ctx.beginPath()
    ctx.arc(lastX, lastY, 2, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()

  }, [history, color])

  return (
    <div className="relative aspect-square bg-cyber-black/40 rounded border border-cyber-border/20 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold" style={{ color }}>
        {Math.round(currentPercent)}%
      </div>
    </div>
  )
}

function App() {
  // System info state
  const [systemInfo, setSystemInfo] = useState(null)
  const [dockerContainers, setDockerContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsClientCount, setWsClientCount] = useState(0)

  // Distribution name for Linux
  const [distroName, setDistroName] = useState('')

  // Remote clients and modal states
  const [remoteClients, setRemoteClients] = useState([])
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [selectedOS, setSelectedOS] = useState('windows')
  const [selectedArch, setSelectedArch] = useState('amd64')
  const [copiedKey, setCopiedKey] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState(null)

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Store core histories
  const [coreHistories, setCoreHistories] = useState([])

  // Store memory history
  const [memoryHistory, setMemoryHistory] = useState([])

  // Store network history
  const [networkHistory, setNetworkHistory] = useState({})

  // Fetch distro name for Linux
  useEffect(() => {
    if (systemInfo?.os?.toLowerCase().includes('linux')) {
      setDistroName(systemInfo.os)
    } else {
      setDistroName(systemInfo?.os || '')
    }
  }, [systemInfo])

  // Fetch remote clients
  const fetchRemoteClients = async () => {
    try {
      const response = await fetch(`${API_BASE}/clients`)
      const data = await response.json()
      setRemoteClients(data.clients || [])
    } catch (error) {
      console.error('Failed to fetch remote clients:', error)
    }
  }

  // Get backend URL for installation commands
  const getBackendUrl = () => {
    return `${window.location.protocol}//${window.location.host}`
  }

  // Copy installation command to clipboard
  const copyCommand = (key, command) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(command)
        .then(() => {
          setCopiedKey(key)
          setTimeout(() => setCopiedKey(null), 2000)
        })
        .catch(() => fallbackCopy(command, key))
    } else {
      fallbackCopy(command, key)
    }
  }

  // Fallback copy method using textarea
  const fallbackCopy = (text, key) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) {
        setCopiedKey(key)
        setTimeout(() => setCopiedKey(null), 2000)
      }
    } catch (err) {
      console.error('Fallback copy error:', err)
    }
    document.body.removeChild(textarea)
  }

  // Get User-Agent string for explicit architecture selection
  const getUserAgent = () => {
    const agents = {
      'windows-amd64': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'windows-arm64': 'Mozilla/5.0 (Windows NT 10.0; Win64; ARM64) AppleWebKit/537.36',
      'linux-amd64': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      'linux-arm64': 'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36',
      'darwin-amd64': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'darwin-arm64': 'Mozilla/5.0 (Macintosh; ARM Mac OS X) AppleWebKit/537.36',
    }
    return agents[`${selectedOS}-${selectedArch}`] || agents['windows-amd64']
  }

  // Get installation command for selected OS and architecture
  const getInstallCommand = () => {
    const url = getBackendUrl()
    const userAgent = getUserAgent()
    const osCommands = {
      windows: `curl -A "${userAgent}" -o mlserver-client.exe "${url}/api/client/download" && mlserver-client.exe -install -server_url "${url}"`,
      linux: `curl -A "${userAgent}" -o mlserver-client "${url}/api/client/download" && chmod +x mlserver-client && sudo ./mlserver-client -install -server_url "${url}"`,
      darwin: `curl -A "${userAgent}" -o mlserver-client "${url}/api/client/download" && chmod +x mlserver-client && sudo ./mlserver-client -install -server_url "${url}"`,
    }
    return osCommands[selectedOS] || ''
  }

  // Get display name for OS
  const getOSDisplayName = (os) => {
    const names = { windows: 'Windows', linux: 'Linux', darwin: 'macOS' }
    return names[os] || os
  }

  // Get display name for architecture
  const getArchDisplayName = (arch) => {
    const names = { amd64: 'AMD64', arm64: 'ARM64' }
    return names[arch] || arch
  }

  // Get current selection key for copy tracking
  const getSelectionKey = () => `${selectedOS}-${selectedArch}`

  // Handle server selection
  const handleServerSelect = (clientId) => {
    setSelectedClientId(clientId)
  }

  // Get current display data based on selected client
  const getCurrentDisplayData = () => {
    if (selectedClientId) {
      const client = remoteClients.find(c => c.server_id === selectedClientId)
      return {
        isLocal: false,
        data: client?.metrics,
        clientInfo: client
      }
    }
    return {
      isLocal: true,
      data: systemInfo,
      clientInfo: null
    }
  }

  const currentDisplay = getCurrentDisplayData()
  const displayInfo = currentDisplay.data || systemInfo

  // Fetch system info
  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/system`)
      const data = await response.json()
      setSystemInfo(data)

      // Update core histories
      if (data.cpu && data.cpu.per_core_percent) {
        setCoreHistories(prevHistories => {
          if (prevHistories.length === 0) {
            const threadCount = data.cpu.threads
            const initialHistories = []
            for (let i = 0; i < threadCount; i++) {
              initialHistories.push(Array(HISTORY_SIZE).fill(0))
            }
            prevHistories = initialHistories
          }

          return prevHistories.map((coreHistory, coreIndex) => {
            const newPercent = data.cpu.per_core_percent[coreIndex] ?? 0
            const newHistory = [...coreHistory, newPercent]
            if (newHistory.length > HISTORY_SIZE) {
              newHistory.shift()
            }
            return newHistory
          })
        })
      }

      // Update memory history
      if (data.memory) {
        setMemoryHistory(prevHistory => {
          const newHistory = [...prevHistory, data.memory.percent]
          if (newHistory.length > HISTORY_SIZE) {
            newHistory.shift()
          }
          return newHistory
        })
      }

      // Update network history
      if (data.network && Array.isArray(data.network)) {
        setNetworkHistory(prevHistory => {
          const newHistory = { ...prevHistory }
          const currentNames = new Set(data.network.map(net => net.name))

          Object.keys(newHistory).forEach(name => {
            if (!currentNames.has(name)) {
              delete newHistory[name]
            }
          })

          data.network.forEach(net => {
            if (!newHistory[net.name]) {
              newHistory[net.name] = {
                up: Array(HISTORY_SIZE).fill(0),
                down: Array(HISTORY_SIZE).fill(0)
              }
            }
            const speedUp = net.speed_up ?? 0
            const speedDown = net.speed_down ?? 0
            newHistory[net.name].up = [...newHistory[net.name].up, speedUp]
            newHistory[net.name].down = [...newHistory[net.name].down, speedDown]
            if (newHistory[net.name].up.length > HISTORY_SIZE) {
              newHistory[net.name].up.shift()
            }
            if (newHistory[net.name].down.length > HISTORY_SIZE) {
              newHistory[net.name].down.shift()
            }
          })
          return newHistory
        })
      }

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch system info:', error)
    }
  }

  // Fetch Docker info
  const fetchDockerInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/docker`)
      const data = await response.json()
      setDockerContainers(data)
    } catch (error) {
      console.error('Failed to fetch Docker info:', error)
    }
  }

  // WebSocket connection
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const baseReconnectDelay = 1000

    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSystemInfo(), fetchDockerInfo()])
      setLoading(false)
    }

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/ws`

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        reconnectAttempts = 0
        setWsConnected(true)
        setLoading(false)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'system') {
            const data = message.data
            setSystemInfo(data)

            if (data.ws_clients !== undefined) {
              setWsClientCount(data.ws_clients)
            }

            if (data.cpu && data.cpu.per_core_percent) {
              setCoreHistories(prevHistories => {
                if (prevHistories.length === 0) {
                  const threadCount = data.cpu.threads
                  const initialHistories = []
                  for (let i = 0; i < threadCount; i++) {
                    initialHistories.push(Array(HISTORY_SIZE).fill(0))
                  }
                  prevHistories = initialHistories
                }

                return prevHistories.map((coreHistory, coreIndex) => {
                  const newPercent = data.cpu.per_core_percent[coreIndex] ?? 0
                  const newHistory = [...coreHistory, newPercent]
                  if (newHistory.length > HISTORY_SIZE) {
                    newHistory.shift()
                  }
                  return newHistory
                })
              })
            }

            if (data.memory) {
              setMemoryHistory(prevHistory => {
                const newHistory = [...prevHistory, data.memory.percent]
                if (newHistory.length > HISTORY_SIZE) {
                  newHistory.shift()
                }
                return newHistory
              })
            }

            if (data.network && Array.isArray(data.network)) {
              setNetworkHistory(prevHistory => {
                const newHistory = { ...prevHistory }
                const currentNames = new Set(data.network.map(net => net.name))

                Object.keys(newHistory).forEach(name => {
                  if (!currentNames.has(name)) {
                    delete newHistory[name]
                  }
                })

                data.network.forEach(net => {
                  if (!newHistory[net.name]) {
                    newHistory[net.name] = {
                      up: Array(HISTORY_SIZE).fill(0),
                      down: Array(HISTORY_SIZE).fill(0)
                    }
                  }
                  const speedUp = net.speed_up ?? 0
                  const speedDown = net.speed_down ?? 0
                  newHistory[net.name].up = [...newHistory[net.name].up, speedUp]
                  newHistory[net.name].down = [...newHistory[net.name].down, speedDown]
                  if (newHistory[net.name].up.length > HISTORY_SIZE) {
                    newHistory[net.name].up.shift()
                  }
                  if (newHistory[net.name].down.length > HISTORY_SIZE) {
                    newHistory[net.name].down.shift()
                  }
                })
                return newHistory
              })
            }

            setLastUpdate(new Date())
          } else if (message.type === 'docker') {
            setDockerContainers(message.data)
          } else if (message.type === 'client') {
            const { server_id, metrics } = message.data
            setRemoteClients(prevClients =>
              prevClients.map(client =>
                client.server_id === server_id
                  ? { ...client, metrics, status: 'online', last_seen: Date.now() / 1000 }
                  : client
              )
            )
            setLastUpdate(new Date())
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = () => {
        setWsConnected(false)
      }

      ws.onclose = () => {
        ws = null
        setWsConnected(false)

        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1)
          reconnectTimeout = setTimeout(connect, delay)
        } else {
          setLoading(false)
        }
      }
    }

    loadData().then(() => {
      connect()
    })

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  // Fetch remote clients periodically
  useEffect(() => {
    fetchRemoteClients()
    const interval = setInterval(fetchRemoteClients, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !systemInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-neon-blue mx-auto mb-4" />
          <p className="text-gray-400">加载服务器数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-row h-screen bg-cyber-black overflow-hidden">
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

      {/* Main content area */}
      <main className="flex-1 my-2 md:my-4 mx-2 md:mx-0 md:mr-4 rounded-2xl md:rounded-3xl bg-cyber-card border border-cyber-border overflow-hidden flex flex-col">
        {/* Mobile menu button */}
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

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {/* Header */}
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

          {/* System Overview */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-neon-blue" />
              系统概览
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* CPU */}
              <div className="glass-card p-6 hover-glow-red lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-neon-red" />
                      CPU
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 break-words font-mono" title={displayInfo?.cpu?.brand}>
                      {displayInfo?.cpu?.brand || '-'}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-neon-red font-mono">
                    {displayInfo?.cpu?.percent.toFixed(1) || 0}%
                  </span>
                </div>

                <div className="flex justify-between text-sm mb-4 text-gray-400">
                  <span className="font-mono">{displayInfo?.cpu?.cores || 0}C / {displayInfo?.cpu?.threads || 0}T</span>
                </div>

                {displayInfo?.cpu?.per_core_percent && (
                  <div className="h-56 w-full rounded-xl overflow-hidden bg-cyber-dark/30 border border-cyber-border/30 p-2">
                    <div className="h-full grid gap-1" style={{
                      gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(displayInfo.cpu.threads)), 12)}, 1fr)`
                    }}>
                      {displayInfo.cpu.per_core_percent.map((percent, index) => (
                        <CoreSquare
                          key={index}
                          index={index}
                          currentPercent={percent}
                          history={coreHistories[index] || []}
                          color={getLineColor(percent)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Memory */}
              <div className="glass-card p-6 hover-glow-green">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MemoryStick className="w-5 h-5 text-neon-green" />
                      内存
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 break-words font-mono" title={displayInfo?.memory?.model || '-'}>
                      {displayInfo?.memory?.model || '-'}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-neon-green font-mono">
                    {displayInfo?.memory?.percent.toFixed(1) || 0}%
                  </span>
                </div>

                <div className="flex justify-between text-sm mb-4 text-gray-400">
                  <span className="font-mono">{displayInfo?.memory?.used_human || '-'} / {displayInfo?.memory?.total_human || '-'}</span>
                </div>

                {displayInfo?.memory && (
                  <MemorySparkline
                    currentPercent={displayInfo.memory.percent}
                    history={memoryHistory}
                  />
                )}
              </div>

              {/* Disk */}
              <div className="glass-card p-6 hover-glow-purple">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                  <HardDrive className="w-5 h-5 text-neon-purple" />
                  磁盘
                </h3>
                <div className="space-y-3">
                  {displayInfo?.disks?.map((disk, index) => (
                    <div key={index} className="bg-cyber-dark/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300 truncate flex-1 font-mono" title={disk.name}>
                          {disk.name}
                        </span>
                        <span className="text-sm font-bold font-mono" style={{ color: COLORS.purple }}>
                          {disk.percent.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar h-1.5">
                        <div
                          className="progress-fill bg-gradient-to-r from-purple-500 to-neon-purple"
                          style={{ width: `${disk.percent}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        {disk.used_human} / {disk.total_human}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Network */}
          {displayInfo?.network && displayInfo.network.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Network className="w-5 h-5 text-neon-blue" />
                网络活动
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayInfo.network.map((net, index) => {
                  const history = networkHistory[net.name] || { up: [], down: [] }
                  return (
                    <div key={index} className="glass-card p-6 hover-glow-blue">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <EthernetPort className="w-5 h-5 text-neon-blue" />
                            <span className="font-mono">Network {index + 1}</span>
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 break-words font-mono" title={`${net.name} @ ${net.ipv4 || '-'} / ${net.ipv6 || '-'}`}>
                            {net.name} @ {net.ipv4 || '-'} / {net.ipv6 || '-'}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm mb-4 text-gray-400">
                        <span className="font-mono">{net.speed ? `${net.speed} Mbps` : '-'}</span>
                      </div>

                      <NetworkSparkline
                        interfaceName={net.name}
                        speedUp={net.speed_up}
                        speedDown={net.speed_down}
                        historyUp={history.up}
                        historyDown={history.down}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* GPU */}
          {displayInfo?.gpu && displayInfo.gpu.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-neon-yellow" />
                GPU 监控
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayInfo.gpu.map((gpu, index) => (
                  <div key={index} className="glass-card p-6 hover-glow-yellow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white font-mono truncate flex-1 flex items-center gap-2" title={gpu.name}>
                        <Gpu className="w-5 h-5 text-neon-yellow flex-shrink-0" />
                        {gpu.name}
                      </h3>
                      <span className={`text-2xl font-bold font-mono ${gpu.temperature > 80 ? 'text-neon-red' : 'text-neon-yellow'}`}>
                        {gpu.temperature}°C
                      </span>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">GPU 利用率</span>
                          <span className="text-neon-blue font-mono">{gpu.utilization}%</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-gradient-to-r from-blue-500 to-neon-blue"
                            style={{ width: `${gpu.utilization}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">显存</span>
                          <span className="text-neon-green font-mono">
                            {gpu.memory.used_human} / {gpu.memory.total_human}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-gradient-to-r from-green-500 to-neon-green"
                            style={{ width: `${gpu.memory.percent}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <Zap className="w-4 h-4" />
                            电源
                          </span>
                          <span className="font-semibold font-mono text-neon-yellow">
                            {gpu.power_usage}W / {gpu.power_limit || gpu.power_default_limit || gpu.enforced_power_limit || '-'}W
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill bg-gradient-to-r from-yellow-500 to-neon-yellow"
                            style={{ width: `${(gpu.power_usage / (gpu.power_limit || gpu.enforced_power_limit || gpu.power_default_limit || 1) * 100) || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Docker */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-neon-blue" />
              Docker 容器
              <span className="text-sm font-normal text-gray-400">
                (<span className="font-mono">{dockerContainers.length}</span> 个运行中)
              </span>
            </h2>
            <div className="glass-card overflow-hidden hover-glow-blue">
              {dockerContainers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>当前没有运行中的容器</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-cyber-dark/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">容器名</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">镜像</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/20">
                      {dockerContainers.map((container, index) => (
                        <tr key={index} className="hover:bg-cyber-dark/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white font-mono">{container.name}</div>
                            <div className="text-xs text-gray-400 font-mono">{container.id.substring(0, 12)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300 font-mono truncate max-w-xs" title={container.image}>
                              {container.image}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              container.state === 'running' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {container.state}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => fetch(`${API_BASE}/docker/${container.id}/action?action=stop`, { method: 'POST' })}
                              className="text-red-400 hover:text-red-300"
                            >
                              停止
                            </button>
                            <button
                              onClick={() => fetch(`${API_BASE}/docker/${container.id}/action?action=restart`, { method: 'POST' })}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              重启
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Download client modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-cyber-border/30">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-neon-blue" />
                下载监控客户端
              </h2>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">选择目标平台</h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">操作系统</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'windows', name: 'Windows', icon: '🪟' },
                      { id: 'linux', name: 'Linux', icon: '🐧' },
                      { id: 'darwin', name: 'macOS', icon: '🍎' },
                    ].map((os) => (
                      <button
                        key={os.id}
                        onClick={() => setSelectedOS(os.id)}
                        className={`flex-1 px-4 py-3 font-medium transition-colors flex items-center justify-center gap-2 rounded-lg border ${
                          selectedOS === os.id
                            ? 'bg-neon-blue/10 border-neon-blue text-neon-blue'
                            : 'bg-cyber-dark/50 border-cyber-border/20 text-gray-400 hover:text-white hover:border-cyber-border/50'
                        }`}
                      >
                        <span>{os.icon}</span>
                        {os.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">架构</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'amd64', name: 'AMD64 (Intel/AMD)' },
                      { id: 'arm64', name: 'ARM64' },
                    ].map((arch) => (
                      <button
                        key={arch.id}
                        onClick={() => setSelectedArch(arch.id)}
                        className={`flex-1 px-4 py-3 font-medium transition-colors rounded-lg border ${
                          selectedArch === arch.id
                            ? 'bg-neon-blue/10 border-neon-blue text-neon-blue'
                            : 'bg-cyber-dark/50 border-cyber-border/20 text-gray-400 hover:text-white hover:border-cyber-border/50'
                        }`}
                      >
                        {arch.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-cyber-border/30 my-6" />

                <h3 className="text-lg font-medium text-white mb-2">安装命令</h3>
                <p className="text-sm text-gray-400 mb-4">
                  目标平台：<span className="text-white font-medium">{getOSDisplayName(selectedOS)} - {getArchDisplayName(selectedArch)}</span>
                </p>
              </div>

              <div className="mb-6">
                <div className="bg-cyber-black rounded-lg border border-cyber-border/30 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-cyber-dark/50 border-b border-cyber-border/20">
                    <span className="text-sm text-gray-400">安装命令</span>
                    <button
                      onClick={() => copyCommand(getSelectionKey(), getInstallCommand())}
                      className="px-3 py-1.5 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/50 rounded text-neon-blue text-sm font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === getSelectionKey() ? (
                        <>
                          <Check className="w-4 h-4" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          复制
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-neon-green font-mono break-all">
                      {getInstallCommand()}
                    </code>
                  </pre>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-400">
                <div className="flex items-start gap-2">
                  <span className="text-neon-blue">1.</span>
                  <span>在目标服务器上运行上述命令下载对应架构的客户端</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-blue">2.</span>
                  <span>运行客户端时使用 <code className="bg-cyber-dark px-1.5 py-0.5 rounded text-neon-green">-install</code> 标志安装为系统服务</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-neon-blue">3.</span>
                  <span>客户端将自动连接并开始向服务器报告指标</span>
                </div>

                {selectedOS === 'windows' && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400">
                      <strong>提示：</strong> Windows 需要管理员权限来安装服务。请以管理员身份运行命令提示符。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
