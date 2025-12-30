import { useState, useEffect } from 'react'
import { RefreshCw, ChevronRight, Server } from 'lucide-react'
import configJson from '../../config.json'
import { HISTORY_SIZE } from './lib/constants'

// Components
import Sidebar from './components/Sidebar'
import DashboardHeader from './components/DashboardHeader'
import SystemOverview from './components/SystemOverview'
import NetworkSection from './components/NetworkSection'
import GpuSection from './components/GpuSection'
import DockerSection from './components/DockerSection'
import DownloadClientModal from './components/DownloadClientModal'

const APP_TITLE = configJson.app.appName
const API_BASE = '/api'

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

  // Store histories
  const [coreHistories, setCoreHistories] = useState([])
  const [memoryHistory, setMemoryHistory] = useState([])
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
      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        remoteClients={remoteClients}
        handleServerSelect={handleServerSelect}
        setShowDownloadModal={setShowDownloadModal}
        APP_TITLE={APP_TITLE}
      />

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
          <DashboardHeader
            currentDisplay={currentDisplay}
            displayInfo={displayInfo}
            distroName={distroName}
            lastUpdate={lastUpdate}
            wsConnected={wsConnected}
            wsClientCount={wsClientCount}
            APP_TITLE={APP_TITLE}
          />

          {/* System Overview */}
          <SystemOverview
            displayInfo={displayInfo}
            coreHistories={coreHistories}
            memoryHistory={memoryHistory}
          />

          {/* Network */}
          <NetworkSection
            displayInfo={displayInfo}
            networkHistory={networkHistory}
          />

          {/* GPU */}
          <GpuSection
            displayInfo={displayInfo}
          />

          {/* Docker */}
          <DockerSection
            dockerContainers={dockerContainers}
            API_BASE={API_BASE}
          />
        </div>
      </main>

      {/* Download client modal */}
      <DownloadClientModal
        show={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        selectedOS={selectedOS}
        setSelectedOS={setSelectedOS}
        selectedArch={selectedArch}
        setSelectedArch={setSelectedArch}
        copiedKey={copiedKey}
        onCopy={copyCommand}
        getOSDisplayName={getOSDisplayName}
        getArchDisplayName={getArchDisplayName}
        getInstallCommand={getInstallCommand}
        getSelectionKey={getSelectionKey}
      />
    </div>
  )
}

export default App
