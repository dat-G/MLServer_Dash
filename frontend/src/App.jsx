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
  Thermometer,
  Zap,
  Network,
  EthernetPort,
  Github,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { Gpu } from 'lucide-react'
import configJson from '../../config.json'

const APP_TITLE = configJson.app.appName
const GITHUB_URL = configJson.app.githubUrl
const HISTORY_SIZE = configJson.server.historySize || 30

const COLORS = {
  blue: '#00d4ff',
  green: '#00ff88',
  red: '#ff3366',
  yellow: '#ffcc00',
  purple: '#b829dd',
  dark: '#1a1a24',
}

// API基础URL
const API_BASE = '/api'

// 发行版Logo SVG组件
function DistroLogo({ distroId, className }) {
  const logos = {
    ubuntu: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <circle cx="15.92" cy="15.92" r="14.75" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15.92" cy="15.92" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="15.92" cy="15.92" r="6.5" fill="currentColor"/>
        <circle cx="15.92" cy="15.92" r="3.5" fill="white"/>
        <circle cx="15.92" cy="15.92" r="2" fill="currentColor"/>
      </svg>
    ),
    debian: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26C9.383 28 4 22.617 4 16S9.383 4 16 4s12 5.383 12 12-5.383 12-12 12z"/>
        <path d="M16 8v16M8 16h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="16" cy="16" r="3" fill="currentColor"/>
      </svg>
    ),
    arch: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26C9.383 28 4 22.617 4 16S9.383 4 16 4s12 5.383 12 12-5.383 12-12 12z"/>
        <path d="M22 10l-6 6 6 6M10 22l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
    fedora: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="currentColor"/>
        <path d="M16 5v11h11c0-6.075-4.925-11-11-11z" fill="white"/>
        <path d="M13 16v13c-6.075 0-11-4.925-11-11s4.925-11 11-11v9z" fill="white"/>
      </svg>
    ),
    centos: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26C9.383 28 4 22.617 4 16S9.383 4 16 4s12 5.383 12 12-5.383 12-12 12z"/>
        <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="8" y="8" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="18" y="8" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="8" y="18" width="6" height="6" rx="1" fill="currentColor"/>
        <rect x="18" y="18" width="6" height="6" rx="1" fill="currentColor"/>
      </svg>
    ),
    rhel: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26C9.383 28 4 22.617 4 16S9.383 4 16 4s12 5.383 12 12-5.383 12-12 12z"/>
        <path d="M10 12h12v8H10z" fill="currentColor"/>
        <path d="M12 14v4M16 14v4M20 14v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    alpine: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2L4 14v14h24V14L16 2zm0 5l10 10v9H6V17L16 7z" fill="currentColor"/>
        <path d="M16 12l-6 6h12l-6-6z" fill="white"/>
      </svg>
    ),
    rocky: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 26C9.383 28 4 22.617 4 16S9.383 4 16 4s12 5.383 12 12-5.383 12-12 12z"/>
        <path d="M16 8l-2 6 2 4 2-4-2-6z" fill="currentColor"/>
        <path d="M16 10v6M14 12l4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="20" r="2" fill="currentColor"/>
        <circle cx="20" cy="20" r="2" fill="currentColor"/>
      </svg>
    ),
    default: (
      <svg viewBox="0 0 32 32" className={className} fill="currentColor">
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 10v12M10 16h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  }

  const logo = logos[distroId] || logos.default
  return logo
}

// 内存折线图组件
function MemorySparkline({ currentPercent, history }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 使用设备像素比提高清晰度
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    // 设置实际像素大小
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height)

    // 根据占用率获取颜色
    const getColor = (percent) => {
      if (percent >= 80) return '#ff3366'
      if (percent >= 50) return '#ffcc00'
      return '#00ff88'
    }

    const color = getColor(currentPercent)

    const dataToDraw = history || []

    // 绘制渐变填充（先画填充，在折线下方）
    if (dataToDraw.length > 0) {
      const stepX = rect.width / (HISTORY_SIZE - 1)

      ctx.beginPath()
      // 从左下角开始
      ctx.moveTo(0, rect.height)

      // 画到第一个点
      if (dataToDraw.length > 0) {
        const firstY = rect.height - (dataToDraw[0] / 100) * rect.height
        ctx.lineTo(0, firstY)
      }

      // 画所有点
      dataToDraw.forEach((percent, i) => {
        const x = i * stepX
        const y = rect.height - (percent / 100) * rect.height
        ctx.lineTo(x, y)
      })

      // 画到最后一个点的x位置，然后到右下角
      const lastX = (dataToDraw.length - 1) * stepX
      ctx.lineTo(lastX, rect.height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, 0, rect.height)
      gradient.addColorStop(0, color + '25')
      gradient.addColorStop(1, color + '05')
      ctx.fillStyle = gradient
      ctx.fill()
    }

    // 绘制折线图
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const stepX = rect.width / (HISTORY_SIZE - 1)

    dataToDraw.forEach((percent, i) => {
      const x = i * stepX
      const y = rect.height - (percent / 100) * rect.height
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }, [history, currentPercent])

  return (
    <div className="h-56 w-full rounded-xl overflow-hidden bg-cyber-dark/30 border border-cyber-border/30">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}

// 网络折线图组件（双线：上行和下行）
function NetworkSparkline({ interfaceName, speedUp, speedDown, historyUp, historyDown }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    // 格式化速度函数
    const formatSpeed = (bytesPerSec) => {
      if (bytesPerSec === null || bytesPerSec === undefined) return '0 B/s'
      if (bytesPerSec >= 1024 * 1024 * 1024) return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(1)} GB/s`
      if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`
      if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
      return `${bytesPerSec.toFixed(0)} B/s`
    }

    // 获取最大值用于Y轴缩放
    const allValues = [...(historyUp || []), ...(historyDown || [])]
    if (allValues.length === 0) return

    const maxValue = Math.max(...allValues.filter(v => v > 0), 1) * 1.2
    const stepX = rect.width / (HISTORY_SIZE - 1)

    // 绘制下行渐变填充和折线（蓝色）
    const dataDown = historyDown || []
    if (dataDown.length > 0) {
      // 渐变填充
      ctx.beginPath()
      ctx.moveTo(0, rect.height)
      const firstY = rect.height - (dataDown[0] / maxValue) * rect.height
      ctx.lineTo(0, firstY)
      dataDown.forEach((value, i) => {
        const x = i * stepX
        const y = rect.height - (value / maxValue) * rect.height
        ctx.lineTo(x, y)
      })
      const lastX = (dataDown.length - 1) * stepX
      ctx.lineTo(lastX, rect.height)
      ctx.closePath()

      const gradientDown = ctx.createLinearGradient(0, 0, 0, rect.height)
      gradientDown.addColorStop(0, '#00d4ff25')
      gradientDown.addColorStop(1, '#00d4ff05')
      ctx.fillStyle = gradientDown
      ctx.fill()
    }

    // 下行折线
    ctx.beginPath()
    ctx.strokeStyle = '#00d4ff'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    dataDown.forEach((value, i) => {
      const x = i * stepX
      const y = rect.height - (value / maxValue) * rect.height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制上行渐变填充和折线（绿色）
    const dataUp = historyUp || []
    if (dataUp.length > 0) {
      // 渐变填充
      ctx.beginPath()
      ctx.moveTo(0, rect.height)
      const firstY = rect.height - (dataUp[0] / maxValue) * rect.height
      ctx.lineTo(0, firstY)
      dataUp.forEach((value, i) => {
        const x = i * stepX
        const y = rect.height - (value / maxValue) * rect.height
        ctx.lineTo(x, y)
      })
      const lastX = (dataUp.length - 1) * stepX
      ctx.lineTo(lastX, rect.height)
      ctx.closePath()

      const gradientUp = ctx.createLinearGradient(0, 0, 0, rect.height)
      gradientUp.addColorStop(0, '#00ff8825')
      gradientUp.addColorStop(1, '#00ff8805')
      ctx.fillStyle = gradientUp
      ctx.fill()
    }

    // 上行折线
    ctx.beginPath()
    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    dataUp.forEach((value, i) => {
      const x = i * stepX
      const y = rect.height - (value / maxValue) * rect.height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制当前值标签
    ctx.font = '10px "Maple Mono", monospace'
    ctx.fillStyle = '#00d4ff'
    ctx.fillText(`↓ ${formatSpeed(speedDown)}`, 5, 12)
    ctx.fillStyle = '#00ff88'
    ctx.fillText(`↑ ${formatSpeed(speedUp)}`, 5, 24)
  }, [historyUp, historyDown, speedUp, speedDown])

  return (
    <div className="h-24 w-full rounded-xl overflow-hidden bg-cyber-dark/30 border border-cyber-border/30">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
    </div>
  )
}

// 单个核心方块组件
function CoreSquare({ index, currentPercent, history, color }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 使用设备像素比提高清晰度
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    // 设置实际像素大小
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // 清空画布
    ctx.clearRect(0, 0, rect.width, rect.height)

    // 绘制折线图
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // 始终绘制HISTORY_SIZE个点，时间轴固定
    const stepX = rect.width / (HISTORY_SIZE - 1)

    // history数组存储这个核心的历史数据，始终保持HISTORY_SIZE长度
    // 初始值是0，随着时间推移被实际数据替换
    const dataToDraw = history || []

    dataToDraw.forEach((percent, i) => {
      const x = i * stepX
      const y = rect.height - (percent / 100) * rect.height
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()
  }, [history, color])

  // 获取背景颜色 - 0%为灰色，然后绿->橙->红渐变
  const getBgColor = (percent) => {
    if (percent === 0) return 'rgba(80, 80, 80, 0.1)'
    if (percent > 80) return 'rgba(255, 51, 102, 0.1)'
    if (percent > 50) return 'rgba(255, 140, 0, 0.1)'
    return 'rgba(0, 255, 136, 0.1)'
  }

  // 获取边框颜色
  const getBorderColor = (percent) => {
    if (percent === 0) return 'rgba(80, 80, 80, 0.25)'
    if (percent > 80) return 'rgba(255, 51, 102, 0.35)'
    if (percent > 50) return 'rgba(255, 140, 0, 0.35)'
    return 'rgba(0, 255, 136, 0.35)'
  }

  // 获取文字颜色
  const getTextColor = (percent) => {
    if (percent === 0) return 'rgba(150, 150, 150, 0.8)'
    if (percent > 80) return '#ff3366'
    if (percent > 50) return '#ff8c00'
    return '#00ff88'
  }

  const textColor = getTextColor(currentPercent)

  return (
    <div
      className="w-full h-full rounded-lg relative overflow-hidden transition-all duration-300 min-h-0"
      style={{
        backgroundColor: getBgColor(currentPercent),
        border: `1px solid ${getBorderColor(currentPercent)}`,
      }}
      title={`核心 ${index}: ${currentPercent.toFixed(1)}%`}
    >
      {/* 折线图 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 核心编号 */}
      <div className="absolute top-0.5 left-1 text-[10px] font-bold" style={{ color: textColor }}>
        {index}
      </div>

      {/* 当前值 */}
      <div className="absolute bottom-0.5 right-1 text-[10px] font-bold" style={{ color: textColor }}>
        {Math.round(currentPercent)}%
      </div>
    </div>
  )
}

function App() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [dockerContainers, setDockerContainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [wsClientCount, setWsClientCount] = useState(0)

  // 存储每个核心的独立历史数据
  const [coreHistories, setCoreHistories] = useState([])

  // 存储内存历史数据
  const [memoryHistory, setMemoryHistory] = useState([])

  // 存储网络历史数据 {interfaceName: {up: [], down: []}}
  const [networkHistory, setNetworkHistory] = useState({})

  // 获取系统信息
  const fetchSystemInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/system`)
      const data = await response.json()
      setSystemInfo(data)

      // 更新每个核心的独立历史数据（含初始化）
      if (data.cpu && data.cpu.per_core_percent) {
        setCoreHistories(prevHistories => {
          // 首次初始化：创建历史数组
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
            // 保持固定长度，移除最旧的数据
            if (newHistory.length > HISTORY_SIZE) {
              newHistory.shift()
            }
            return newHistory
          })
        })
      }

      // 更新内存历史数据
      if (data.memory) {
        setMemoryHistory(prevHistory => {
          const newHistory = [...prevHistory, data.memory.percent]
          if (newHistory.length > HISTORY_SIZE) {
            newHistory.shift()
          }
          return newHistory
        })
      }

      // 更新网络历史数据
      if (data.network && Array.isArray(data.network)) {
        setNetworkHistory(prevHistory => {
          const newHistory = { ...prevHistory }
          const currentNames = new Set(data.network.map(net => net.name))

          // 清理已不存在的接口历史数据
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
      console.error('获取系统信息失败:', error)
    }
  }

  // 获取Docker容器信息
  const fetchDockerInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/docker`)
      const data = await response.json()
      setDockerContainers(data)
    } catch (error) {
      console.error('获取Docker信息失败:', error)
    }
  }

  // WebSocket 连接管理
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const baseReconnectDelay = 1000 // 1秒

    // 初始加载数据
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSystemInfo(), fetchDockerInfo()])
      setLoading(false)
    }

    // 建立 WebSocket 连接
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}/api/ws`

      console.log('Connecting to WebSocket:', wsUrl)
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttempts = 0
        setWsConnected(true)
        setLoading(false)
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'system') {
            // 更新系统信息（复用现有的状态更新逻辑）
            const data = message.data
            setSystemInfo(data)

            // 更新 WebSocket 客户端数量
            if (data.ws_clients !== undefined) {
              setWsClientCount(data.ws_clients)
            }

            // 更新每个核心的独立历史数据
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

            // 更新内存历史数据
            if (data.memory) {
              setMemoryHistory(prevHistory => {
                const newHistory = [...prevHistory, data.memory.percent]
                if (newHistory.length > HISTORY_SIZE) {
                  newHistory.shift()
                }
                return newHistory
              })
            }

            // 更新网络历史数据
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
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        ws = null
        setWsConnected(false)

        // 尝试重连
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts - 1) // 指数退避
          console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`)
          reconnectTimeout = setTimeout(connect, delay)
        } else {
          console.error('Max reconnection attempts reached')
          setLoading(false)
        }
      }
    }

    // 先加载数据，然后建立 WebSocket 连接
    loadData().then(() => {
      connect()
    })

    // 清理函数
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [])

  // 设置页面标题
  useEffect(() => {
    document.title = APP_TITLE
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

  // 获取折线颜色 - 0%为灰色，然后绿->橙->红渐变
  const getLineColor = (percent) => {
    if (percent === 0) return 'rgba(120, 120, 120, 0.5)'
    if (percent > 80) return '#ff3366'
    if (percent > 50) return '#ff8c00'
    return '#00ff88'
  }

  // 发行版信息
  const distroName = systemInfo.distro?.name
  const distroId = systemInfo.distro?.id || ''

  return (
    <div className="min-h-screen bg-cyber-black p-4 md:p-8">
      {/* 头部 */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              <Server className="inline-block w-8 h-8 mr-2 text-neon-blue" />
              {APP_TITLE}
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-gray-400 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span className="font-mono">{systemInfo.hostname}</span>
                </span>
                <span>|</span>
                <span className="text-white font-medium font-mono">{distroName || systemInfo.os}</span>
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
                    {String(Math.floor(systemInfo.uptime / 3600)).padStart(2, '0')}:
                    {String(Math.floor((systemInfo.uptime % 3600) / 60)).padStart(2, '0')}:
                    {String(systemInfo.uptime % 60).padStart(2, '0')}
                  </span>
                </span>
              </div>
              <span className={`flex items-center gap-1 ${wsConnected ? 'text-neon-green' : 'text-gray-500'}`} title={wsConnected ? 'WebSocket 已连接' : 'WebSocket 未连接'}>
                {wsConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="font-mono text-sm">({wsClientCount})</span>
              </span>
            </div>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors duration-200 text-sm"
            >
              <Github className="w-4 h-4" />
              <span className="font-mono">dat-G/MLServer_Dash</span>
            </a>
          </div>
        </div>
      </header>

      {/* 系统概览 */}
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
                <p className="text-xs text-gray-400 mt-1 break-words font-mono" title={systemInfo.cpu.brand}>
                  {systemInfo.cpu.brand}
                </p>
              </div>
              <span className="text-2xl font-bold text-neon-red font-mono">
                {systemInfo.cpu.percent.toFixed(1)}%
              </span>
            </div>

            {/* 每个核心的占用率 - 方框视图 + 折线图 */}
            {/* 核心数行 */}
            <div className="flex justify-between text-sm mb-4 text-gray-400">
              <span className="font-mono">{systemInfo.cpu.cores}C / {systemInfo.cpu.threads}T</span>
            </div>

            {/* 核心折线图容器框 */}
            <div className="h-56 w-full rounded-xl overflow-hidden bg-cyber-dark/30 border border-cyber-border/30 p-2">
              <div className="h-full grid gap-1" style={{
                gridTemplateColumns: `repeat(${Math.min(Math.ceil(Math.sqrt(systemInfo.cpu.threads)), 12)}, 1fr)`
              }}>
                {systemInfo.cpu.per_core_percent.map((percent, index) => (
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
          </div>

          {/* 中间列：内存 */}
          <div className="glass-card p-6 hover-glow-green">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MemoryStick className="w-5 h-5 text-neon-green" />
                  内存
                </h3>
                <p className="text-xs text-gray-400 mt-1 break-words font-mono" title={systemInfo.memory.model || '-'}>
                  {systemInfo.memory.model || '-'}
                </p>
              </div>
              <span className="text-2xl font-bold text-neon-green font-mono">
                {systemInfo.memory.percent.toFixed(1)}%
              </span>
            </div>

            {/* 内存详情行 */}
            <div className="flex justify-between text-sm mb-4 text-gray-400">
              <span className="font-mono">{systemInfo.memory.used_human} / {systemInfo.memory.total_human}</span>
            </div>

            {/* 内存折线图 */}
            <MemorySparkline
              currentPercent={systemInfo.memory.percent}
              history={memoryHistory}
            />
          </div>

          {/* 右侧列：磁盘列表 */}
          <div className="glass-card p-6 hover-glow-purple">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <HardDrive className="w-5 h-5 text-neon-purple" />
              磁盘
            </h3>
            <div className="space-y-3">
              {systemInfo.disks.map((disk, index) => (
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

      {/* 网络活动 */}
      {systemInfo.network && systemInfo.network.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Network className="w-5 h-5 text-neon-blue" />
            网络活动
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemInfo.network.map((net, index) => {
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

                  {/* 网卡速率 */}
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

      {/* GPU监控 */}
      {systemInfo.gpu && systemInfo.gpu.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-yellow" />
            GPU 监控
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {systemInfo.gpu.map((gpu, index) => (
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
                  {/* GPU利用率 */}
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
                  {/* 显存 */}
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
                  {/* 电源使用/TDP */}
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

      {/* Docker容器 */}
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
                <thead className="bg-cyber-dark">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">名称</th>
                    <th className="px-4 py-3 font-medium">镜像</th>
                    <th className="px-4 py-3 font-medium">端口</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border">
                  {dockerContainers.map((container) => (
                    <tr key={container.id} className="hover:bg-cyber-dark/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="status-dot running" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-white font-mono">{container.name}</span>
                        <span className="text-gray-500 text-sm ml-2 font-mono">{container.id}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 font-mono">{container.image}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                        {container.ports}
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
  )
}

export default App
