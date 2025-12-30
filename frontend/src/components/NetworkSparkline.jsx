import { useEffect, useRef } from 'react'
import { HISTORY_SIZE, COLORS } from '../lib/constants'

export default function NetworkSparkline({ interfaceName, speedUp, speedDown, historyUp, historyDown }) {
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
