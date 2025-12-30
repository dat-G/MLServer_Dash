import { Network, EthernetPort } from 'lucide-react'
import NetworkSparkline from './NetworkSparkline'

export default function NetworkSection({ displayInfo, networkHistory }) {
  if (!displayInfo?.network || displayInfo.network.length === 0) return null

  return (
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
  )
}
