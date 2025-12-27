package monitor

import (
	"encoding/json"
	"os/exec"
	"runtime"
	"strconv"
	"strings"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
)

var (
	gpuAvailable    bool
	gpuCommandFound bool
)

// InitGPU 初始化GPU监控
func InitGPU() {
	// 检查 nvidia-smi 是否可用
	cmd := "nvidia-smi"
	if runtime.GOOS == "windows" {
		cmd = "nvidia-smi.exe"
	}

	_, err := exec.LookPath(cmd)
	gpuCommandFound = err == nil
	gpuAvailable = gpuCommandFound
}

// nvidiaSMIOutput 表示 nvidia-smi JSON 输出的结构
type nvidiaSMIOutput struct {
	GPUs []struct {
		Name        string `json:"name"`
		Utility     uint64 `json:"utilization_gpu"`
		MemoryUtil  uint64 `json:"utilization_memory"`
		Temperature uint64 `json:"temperature_gpu"`
		PowerDraw   uint64 `json:"power_draw"`
		PowerLimit  uint64 `json:"power_limit"`
		MemoryTotal uint64 `json:"memory_total"`
		MemoryUsed  uint64 `json:"memory_used"`
		MemoryFree  uint64 `json:"memory_free"`
	} `json:"gpu"`
}

// GetGPUInfo 获取GPU信息
func GetGPUInfo() []models.GPUInfo {
	if !gpuAvailable {
		return []models.GPUInfo{}
	}

	// 使用 nvidia-smi --query-gpu 命令获取GPU信息
	cmd := exec.Command("nvidia-smi",
		"--query-gpu=name,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,enforced.power.limit,power.default_limit,memory.total,memory.used,memory.free",
		"--format=csv,noheader,nounits")

	output, err := cmd.Output()
	if err != nil {
		// 如果 CSV 格式失败，返回空数组
		return []models.GPUInfo{}
	}

	return parseGPUInfoCSV(string(output))
}

// getGPUInfoJSON 使用 JSON 格式获取 GPU 信息
func getGPUInfoJSON() []models.GPUInfo {
	cmd := exec.Command("nvidia-smi", "--query-gpu=json", "-x")
	output, err := cmd.Output()
	if err != nil {
		return []models.GPUInfo{}
	}

	var data nvidiaSMIOutput
	if err := json.Unmarshal(output, &data); err != nil {
		return []models.GPUInfo{}
	}

	var gpus []models.GPUInfo
	for _, gpu := range data.GPUs {
		total := gpu.MemoryTotal * 1024 * 1024 // 转换为字节
		used := gpu.MemoryUsed * 1024 * 1024
		free := gpu.MemoryFree * 1024 * 1024
		percent := float64(used) / float64(total) * 100

		gpus = append(gpus, models.GPUInfo{
			Name:               gpu.Name,
			Memory:             makeGPUMemory(total, used, free, percent),
			Utilization:        float64(gpu.Utility),
			Temperature:        int(gpu.Temperature),
			PowerUsage:         int(gpu.PowerDraw) / 1000,  // 转换为瓦特
			PowerLimit:         int(gpu.PowerLimit) / 1000,
			EnforcedPowerLimit: 0,
			PowerDefaultLimit:  0,
		})
	}

	return gpus
}

// parseGPUInfoCSV 解析 nvidia-smi CSV 输出
func parseGPUInfoCSV(output string) []models.GPUInfo {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	var gpus []models.GPUInfo

	for _, line := range lines {
		fields := strings.Split(line, ",")
		if len(fields) < 11 {
			continue
		}

		// 解析每个字段
		// name,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,enforced.power.limit,power.default_limit,memory.total,memory.used,memory.free
		name := strings.TrimSpace(fields[0])
		utilStr := strings.TrimSpace(fields[1])
		_ = strings.TrimSpace(fields[2]) // memUtilStr 未使用
		tempStr := strings.TrimSpace(fields[3])
		powerDrawStr := strings.TrimSpace(fields[4])
		powerLimitStr := strings.TrimSpace(fields[5])
		enforcedPowerLimitStr := strings.TrimSpace(fields[6])
		powerDefaultLimitStr := strings.TrimSpace(fields[7])
		memTotalStr := strings.TrimSpace(fields[8])
		memUsedStr := strings.TrimSpace(fields[9])
		memFreeStr := strings.TrimSpace(fields[10])

		utilization, _ := strconv.ParseFloat(strings.TrimSuffix(utilStr, " %"), 64)
		temperature, _ := strconv.Atoi(tempStr)

		// 解析功率（处理 [N/A] 值）
		var powerDraw float64
		if powerDrawStr != "[N/A]" && powerDrawStr != "" {
			powerDraw, _ = strconv.ParseFloat(strings.TrimSpace(powerDrawStr), 64)
		}

		var powerLimit float64
		if powerLimitStr != "[N/A]" && powerLimitStr != "" {
			powerLimit, _ = strconv.ParseFloat(strings.TrimSpace(powerLimitStr), 64)
		}

		var enforcedPowerLimit float64
		if enforcedPowerLimitStr != "[N/A]" && enforcedPowerLimitStr != "" {
			enforcedPowerLimit, _ = strconv.ParseFloat(strings.TrimSpace(enforcedPowerLimitStr), 64)
		}

		var powerDefaultLimit float64
		if powerDefaultLimitStr != "[N/A]" && powerDefaultLimitStr != "" {
			powerDefaultLimit, _ = strconv.ParseFloat(strings.TrimSpace(powerDefaultLimitStr), 64)
		}

		memTotal, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memTotalStr), " MiB"), 10, 64)
		memUsed, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memUsedStr), " MiB"), 10, 64)
		memFree, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memFreeStr), " MiB"), 10, 64)

		total := memTotal * 1024 * 1024
		used := memUsed * 1024 * 1024
		free := memFree * 1024 * 1024
		percent := float64(used) / float64(total) * 100

		gpus = append(gpus, models.GPUInfo{
			Name:               name,
			Memory:             makeGPUMemory(total, used, free, percent),
			Utilization:        utilization,
			Temperature:        temperature,
			PowerUsage:         int(powerDraw),
			PowerLimit:         int(powerLimit),
			EnforcedPowerLimit: int(enforcedPowerLimit),
			PowerDefaultLimit:  int(powerDefaultLimit),
		})
	}

	return gpus
}

// makeGPUMemory 创建 GPUMemory 结构
func makeGPUMemory(total, used, free uint64, percent float64) models.GPUMemory {
	return models.GPUMemory{
		Total:      total,
		Used:       used,
		Free:       free,
		Percent:    percent,
		TotalHuman: FormatBytes(total),
		UsedHuman:  FormatBytes(used),
	}
}

// IsGPUAvailable 检查GPU是否可用
func IsGPUAvailable() bool {
	return gpuAvailable
}

// Shutdown 关闭GPU监控
func Shutdown() {
	// 不需要关闭任何资源，nvidia-smi 是无状态的
}
