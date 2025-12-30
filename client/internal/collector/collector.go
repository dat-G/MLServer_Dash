package collector

import (
	"fmt"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

// SystemInfo matches the backend's SystemInfo structure
type SystemInfo struct {
	Hostname string             `json:"hostname"`
	OS       string             `json:"os"`
	Distro   *DistroInfo        `json:"distro,omitempty"`
	CPU      CPUInfo            `json:"cpu"`
	Memory   MemoryInfo         `json:"memory"`
	Disks    []DiskInfo         `json:"disks"`
	Uptime   int                `json:"uptime"`
	GPU      []GPUInfo          `json:"gpu,omitempty"`
	Network  []NetworkInterface `json:"network,omitempty"`
}

// DistroInfo represents distribution information
type DistroInfo struct {
	Name string `json:"name,omitempty"`
	ID   string `json:"id,omitempty"`
}

// CPUInfo represents CPU information
type CPUInfo struct {
	Brand          string    `json:"brand"`
	Percent        float64   `json:"percent"`
	Cores          int       `json:"cores"`
	Threads        int       `json:"threads"`
	PerCorePercent []float64 `json:"per_core_percent"`
}

// MemoryInfo represents memory information
type MemoryInfo struct {
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
	FreeHuman  string  `json:"free_human"`
}

// DiskInfo represents disk information
type DiskInfo struct {
	Name       string  `json:"name"`
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
	FreeHuman  string  `json:"free_human"`
}

// NetworkInterface represents network interface information
type NetworkInterface struct {
	Name        string   `json:"name"`
	IPv4        string   `json:"ipv4,omitempty"`
	IPv6        string   `json:"ipv6,omitempty"`
	BytesSent   uint64   `json:"bytes_sent"`
	BytesRecv   uint64   `json:"bytes_recv"`
	PacketsSent uint64   `json:"packets_sent"`
	PacketsRecv uint64   `json:"packets_recv"`
	ErrorsIn    int      `json:"errors_in"`
	ErrorsOut   int      `json:"errors_out"`
	DropsIn     int      `json:"drops_in"`
	DropsOut    int      `json:"drops_out"`
	SpeedUp     *float64 `json:"speed_up,omitempty"`
	SpeedDown   *float64 `json:"speed_down,omitempty"`
}

// GPUInfo represents GPU information
type GPUInfo struct {
	Name        string     `json:"name"`
	Memory      GPUMemory  `json:"memory"`
	Utilization float64    `json:"utilization"`
	Temperature int        `json:"temperature"`
	PowerUsage  int        `json:"power_usage"`
}

// GPUMemory represents GPU memory information
type GPUMemory struct {
	Total      uint64  `json:"total"`
	Used       uint64  `json:"used"`
	Free       uint64  `json:"free"`
	Percent    float64 `json:"percent"`
	TotalHuman string  `json:"total_human"`
	UsedHuman  string  `json:"used_human"`
}

// MetricsReport is sent to report metrics
type MetricsReport struct {
	ServerID string      `json:"server_id,omitempty"`
	System   SystemInfo  `json:"system"`
}

// NetworkStats stores previous network statistics
var (
	lastNetworkStats = make(map[string]net.IOCountersStat)
	lastNetworkTime  time.Time
)

// InitGPU initializes GPU monitoring
func InitGPU() {
	// Check if nvidia-smi is available
	initGPUMonitoring()
}

// CollectMetrics collects all system metrics
func CollectMetrics() SystemInfo {
	hostInfo, _ := host.Info()

	return SystemInfo{
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

// GetCPUInfo gets CPU information
func GetCPUInfo() CPUInfo {
	brand, _ := cpu.Info()
	var brandStr string
	if len(brand) > 0 {
		brandStr = brand[0].ModelName
	}
	if brandStr == "" {
		brandStr = runtime.GOARCH + " CPU"
	}

	physicalCores, _ := cpu.Counts(false)
	logicalCores, _ := cpu.Counts(true)
	perCorePercent, _ := cpu.Percent(0, true)

	var totalPercent float64
	if len(perCorePercent) > 0 {
		sum := 0.0
		for _, p := range perCorePercent {
			sum += p
		}
		totalPercent = sum / float64(len(perCorePercent))
	}

	return CPUInfo{
		Brand:          brandStr,
		Percent:        totalPercent,
		Cores:          physicalCores,
		Threads:        logicalCores,
		PerCorePercent: perCorePercent,
	}
}

// GetMemoryInfo gets memory information
func GetMemoryInfo() MemoryInfo {
	vmem, _ := mem.VirtualMemory()

	return MemoryInfo{
		Total:      vmem.Total,
		Used:       vmem.Used,
		Free:       vmem.Free,
		Percent:    vmem.UsedPercent,
		TotalHuman: FormatBytes(vmem.Total),
		UsedHuman:  FormatBytes(vmem.Used),
		FreeHuman:  FormatBytes(vmem.Free),
	}
}

// GetDiskInfo gets disk information
func GetDiskInfo() []DiskInfo {
	var disks []DiskInfo

	partitions, _ := disk.Partitions(false)
	processedDevices := make(map[string]bool)

	for _, partition := range partitions {
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

		diskName := partition.Device
		if len(diskName) > 20 {
			diskName = "Disk"
		}
		if diskName == "" {
			diskName = "Disk"
		}

		if processedDevices[diskName] {
			continue
		}
		processedDevices[diskName] = true

		disks = append(disks, DiskInfo{
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

	if len(disks) == 0 {
		usage, err := disk.Usage("/")
		if err == nil {
			disks = append(disks, DiskInfo{
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

// GetNetworkInfo gets network interface information
func GetNetworkInfo() []NetworkInterface {
	var interfaces []NetworkInterface

	currentTime := time.Now()
	netIO, _ := net.IOCounters(true)

	for _, stats := range netIO {
		if stats.Name == "lo" || stats.Name == "Loopback" {
			continue
		}

		addrs, _ := net.Interfaces()
		var ipv4, ipv6 string

		for _, iface := range addrs {
			if iface.Name == stats.Name {
				for _, addr := range iface.Addrs {
					if addr.Addr != "" {
						if len(addr.Addr) < 20 {
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

		interfaces = append(interfaces, NetworkInterface{
			Name:        stats.Name,
			IPv4:        ipv4,
			IPv6:        ipv6,
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

		lastNetworkStats[stats.Name] = stats
	}

	lastNetworkTime = currentTime
	return interfaces
}

// GetUptime gets system uptime in seconds
func GetUptime() int {
	uptime, _ := host.Uptime()
	return int(uptime)
}

// GetDistroInfo gets distribution information
func GetDistroInfo() *DistroInfo {
	platform, _, _, _ := host.PlatformInformation()

	if platform != "" {
		return &DistroInfo{
			Name: platform,
			ID:   platform,
		}
	}

	return nil
}

// FormatBytes formats bytes to human readable format
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
