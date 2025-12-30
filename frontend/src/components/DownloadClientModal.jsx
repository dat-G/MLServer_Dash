import { X, Copy, Check, Terminal } from 'lucide-react'

export default function DownloadClientModal({
  show,
  onClose,
  selectedOS,
  setSelectedOS,
  selectedArch,
  setSelectedArch,
  copiedKey,
  onCopy,
  getOSDisplayName,
  getArchDisplayName,
  getInstallCommand,
  getSelectionKey,
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="glass-card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyber-border/30">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-neon-blue" />
            下载监控客户端
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">选择目标平台</h3>

            {/* OS Selection */}
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

            {/* Architecture Selection */}
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

          {/* Install Command */}
          <div className="mb-6">
            <div className="bg-cyber-black rounded-lg border border-cyber-border/30 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-cyber-dark/50 border-b border-cyber-border/20">
                <span className="text-sm text-gray-400">安装命令</span>
                <button
                  onClick={() => onCopy(getSelectionKey(), getInstallCommand())}
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

          {/* Instructions */}
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
  )
}
