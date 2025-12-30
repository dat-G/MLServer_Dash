import { useEffect, useRef } from 'react'
import { HISTORY_SIZE } from '../lib/constants'

export default function CoreSquare({ index, currentPercent, history, color }) {
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
    <div className="relative w-full h-full min-h-0 bg-cyber-black/40 rounded border border-cyber-border/20 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-0.5 right-0.5 text-[8px] font-mono font-bold" style={{ color }}>
        {Math.round(currentPercent)}%
      </div>
    </div>
  )
}
