import { Activity, Cpu, HardDrive, MemoryStick } from 'lucide-react'
import CoreSquare from './CoreSquare'
import MemorySparkline from './MemorySparkline'

const COLORS = {
  red: '#ef4444',
  green: '#22c55e',
  purple: '#a855f7',
}

const getLineColor = (percent) => {
  if (percent >= 80) return COLORS.red
  if (percent >= 60) return '#eab308'
  if (percent >= 40) return '#3b82f6'
  return COLORS.green
}

export default function SystemOverview({ displayInfo, coreHistories, memoryHistory }) {
  return (
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

          {displayInfo?.cpu?.per_core_percent && (() => {
            const threads = displayInfo.cpu.threads
            // Calculate optimal columns based on thread count
            let columns = 4
            if (threads <= 4) columns = 2
            else if (threads <= 8) columns = 4
            else if (threads <= 16) columns = 4
            else if (threads <= 32) columns = 8
            else columns = Math.min(12, Math.ceil(Math.sqrt(threads)))

            return (
              <div className="h-56 w-full rounded-xl overflow-hidden bg-cyber-dark/30 border border-cyber-border/30 p-2">
                <div className="h-full grid gap-1" style={{
                  gridTemplateColumns: `repeat(${columns}, 1fr)`
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
            )
          })()}
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
  )
}
