import { useEffect, useRef } from 'react'
import { HISTORY_SIZE, COLORS } from '../lib/constants'

export default function MemorySparkline({ currentPercent, history }) {
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
