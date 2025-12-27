package monitor

import (
	"fmt"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
)

// NetworkStats 存储上一次的网络统计信息
var (
	lastNetworkStats = make(map[string]net.IOCountersStat)
	lastNetworkTime  time.Time
)

// FormatBytes 格式化字节数为可读格式
func FormatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%.2f B", float64(bytes))
	}
	div, exp := uint64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// GetCPUInfo 获取CPU信息
func GetCPUInfo() models.CPUInfo {
	// 获取CPU型号
	brand, _ := cpu.Info()
	var brandStr string
	if len(brand) > 0 {
		brandStr = brand[0].ModelName
	}
	if brandStr == "" {
		brandStr = runtime.GOARCH + " CPU"
	}

	// 获取物理核心数和逻辑核心数
	physicalCores, _ := cpu.Counts(false)
	logicalCores, _ := cpu.Counts(true)

	// 获取每核心占用率
	perCorePercent, _ := cpu.Percent(0, true)

	// 计算总体占用率
	var totalPercent float64
	if len(perCorePercent) > 0 {
		sum := 0.0
		for _, p := range perCorePercent {
			sum += p
		}
		totalPercent = sum / float64(len(perCorePercent))
	}

	return models.CPUInfo{
		Brand:          brandStr,
		Percent:        totalPercent,
		Cores:          physicalCores,
		Threads:        logicalCores,
		PerCorePercent: perCorePercent,
	}
}

// GetMemoryInfo 获取内存信息
func GetMemoryInfo() models.MemoryInfo {
	vmem, _ := mem.VirtualMemory()

	return models.MemoryInfo{
		Total:      vmem.Total,
		Used:       vmem.Used,
		Free:       vmem.Free,
		Percent:    vmem.UsedPercent,
		TotalHuman: FormatBytes(vmem.Total),
		UsedHuman:  FormatBytes(vmem.Used),
		FreeHuman:  FormatBytes(vmem.Free),
	}
}

// GetDiskInfo 获取磁盘信息
func GetDiskInfo() []models.DiskInfo {
	var disks []models.DiskInfo

	partitions, _ := disk.Partitions(false)

	processedDevices := make(map[string]bool)

	for _, partition := range partitions {
		// 跳过特殊文件系统
		if partition.Fstype == "squashfs" || partition.Fstype == "tmpfs" ||
			partition.Fstype == "proc" || partition.Fstype == "sysfs" ||
			partition.Fstype == "devtmpfs" || partition.Fstype == "devpts" ||
			partition.Fstype == "cgroup" || partition.Fstype == "configfs" {
			continue
		}

		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}

		// 使用设备名作为磁盘名
		diskName := partition.Device
		if len(diskName) > 0 {
			// 简化设备名显示
			if len(diskName) > 20 {
				diskName = "Disk"
			}
		} else {
			diskName = "Disk"
		}

		// 避免重复添加同一设备
		if processedDevices[diskName] {
			continue
		}
		processedDevices[diskName] = true

		disks = append(disks, models.DiskInfo{
			Name:       diskName,
			Total:      usage.Total,
			Used:       usage.Used,
			Free:       usage.Free,
			Percent:    usage.UsedPercent,
			TotalHuman: FormatBytes(usage.Total),
			UsedHuman:  FormatBytes(usage.Used),
			FreeHuman:  FormatBytes(usage.Free),
		})
	}

	// 备用方案：如果没有找到磁盘，使用根目录
	if len(disks) == 0 {
		usage, err := disk.Usage("/")
		if err == nil {
			disks = append(disks, models.DiskInfo{
				Name:       "Root Disk",
				Total:      usage.Total,
				Used:       usage.Used,
				Free:       usage.Free,
				Percent:    usage.UsedPercent,
				TotalHuman: FormatBytes(usage.Total),
				UsedHuman:  FormatBytes(usage.Used),
				FreeHuman:  FormatBytes(usage.Free),
			})
		}
	}

	return disks
}

// GetNetworkInfo 获取网络接口信息
func GetNetworkInfo() []models.NetworkInterface {
	var interfaces []models.NetworkInterface

	currentTime := time.Now()
	netIO, _ := net.IOCounters(true)

	// 过滤物理网卡
	for _, stats := range netIO {
		// 跳过本地回环和虚拟接口
		if stats.Name == "lo" || stats.Name == "Loopback" {
			continue
		}

		// 获取网络接口地址
		addrs, _ := net.Interfaces()
		var ipv4, ipv6 string
		var speed *int

		for _, iface := range addrs {
			if iface.Name == stats.Name {
				for _, addr := range iface.Addrs {
					if addr.Addr != "" {
						if len(addr.Addr) < 20 { // 简单判断IPv4
							if ipv4 == "" {
								ipv4 = addr.Addr
							}
						} else {
							if ipv6 == "" {
								ipv6 = addr.Addr
							}
						}
					}
				}
				break
			}
		}

		var speedUp, speedDown *float64

		// 计算速度（如果有上次数据）
		if lastStats, exists := lastNetworkStats[stats.Name]; exists && !lastNetworkTime.IsZero() {
			timeDiff := currentTime.Sub(lastNetworkTime).Seconds()
			if timeDiff > 0 {
				bytesSentDiff := float64(stats.BytesSent - lastStats.BytesSent)
				bytesRecvDiff := float64(stats.BytesRecv - lastStats.BytesRecv)
				if bytesSentDiff >= 0 {
					su := bytesSentDiff / timeDiff
					speedUp = &su
				}
				if bytesRecvDiff >= 0 {
					sd := bytesRecvDiff / timeDiff
					speedDown = &sd
				}
			}
		}

		interfaces = append(interfaces, models.NetworkInterface{
			Name:        stats.Name,
			IPv4:        ipv4,
			IPv6:        ipv6,
			Speed:       speed,
			BytesSent:   stats.BytesSent,
			BytesRecv:   stats.BytesRecv,
			PacketsSent: stats.PacketsSent,
			PacketsRecv: stats.PacketsRecv,
			ErrorsIn:    int(stats.Errin),
			ErrorsOut:   int(stats.Errout),
			DropsIn:     int(stats.Dropin),
			DropsOut:    int(stats.Dropout),
			SpeedUp:     speedUp,
			SpeedDown:   speedDown,
		})

		// 保存当前统计信息
		lastNetworkStats[stats.Name] = stats
	}

	lastNetworkTime = currentTime

	return interfaces
}

// GetUptime 获取系统运行时间（秒）
func GetUptime() int {
	uptime, _ := host.Uptime()
	return int(uptime)
}

// GetDistroInfo 获取发行版信息
func GetDistroInfo() *models.DistroInfo {
	platform, _, _, _ := host.PlatformInformation()

	// 尝试获取更详细的发行版信息
	if platform != "" {
		return &models.DistroInfo{
			Name: platform,
			ID:   platform,
		}
	}

	return nil
}

// GetSystemInfo 获取完整系统信息
func GetSystemInfo() models.SystemInfo {
	hostInfo, _ := host.Info()

	return models.SystemInfo{
		Hostname: hostInfo.Hostname,
		OS:       hostInfo.OS + " " + hostInfo.KernelVersion,
		Distro:   GetDistroInfo(),
		CPU:      GetCPUInfo(),
		Memory:   GetMemoryInfo(),
		Disks:    GetDiskInfo(),
		Uptime:   GetUptime(),
		GPU:      GetGPUInfo(),
		Network:  GetNetworkInfo(),
	}
}
