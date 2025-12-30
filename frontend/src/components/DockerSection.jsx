import { Layers } from 'lucide-react'

export default function DockerSection({ dockerContainers, API_BASE }) {
  return (
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
  )
}
