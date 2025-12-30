import { Zap } from 'lucide-react'
import { Gpu } from 'lucide-react'

export default function GpuSection({ displayInfo }) {
  if (!displayInfo?.gpu || displayInfo.gpu.length === 0) return null

  return (
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
              {/* GPU utilization */}
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
              {/* Memory */}
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
              {/* Power */}
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
  )
}
