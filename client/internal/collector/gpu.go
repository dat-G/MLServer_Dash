package collector

import (
	"os/exec"
	"runtime"
	"strconv"
	"strings"
)

var (
	gpuAvailable bool
)

func initGPUMonitoring() {
	cmd := "nvidia-smi"
	if runtime.GOOS == "windows" {
		cmd = "nvidia-smi.exe"
	}
	_, err := exec.LookPath(cmd)
	gpuAvailable = err == nil
}

// GetGPUInfo gets GPU information using nvidia-smi
func GetGPUInfo() []GPUInfo {
	if !gpuAvailable {
		return []GPUInfo{}
	}

	cmd := exec.Command("nvidia-smi",
		"--query-gpu=name,utilization.gpu,utilization.memory,temperature.gpu,power.draw,power.limit,enforced.power.limit,power.default_limit,memory.total,memory.used,memory.free",
		"--format=csv,noheader,nounits")

	output, err := cmd.Output()
	if err != nil {
		return []GPUInfo{}
	}

	return parseGPUInfoCSV(string(output))
}

func parseGPUInfoCSV(output string) []GPUInfo {
	lines := strings.Split(strings.TrimSpace(output), "\n")
	var gpus []GPUInfo

	for _, line := range lines {
		fields := strings.Split(line, ",")
		if len(fields) < 11 {
			continue
		}

		name := strings.TrimSpace(fields[0])
		utilStr := strings.TrimSpace(fields[1])
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

		var powerDraw float64
		if powerDrawStr != "[N/A]" && powerDrawStr != "" {
			powerDraw, _ = strconv.ParseFloat(strings.TrimSpace(powerDrawStr), 64)
		}

		// Power limits (parsed but not currently used)
		_, _ = strconv.ParseFloat(strings.TrimSpace(powerLimitStr), 64)
		_, _ = strconv.ParseFloat(strings.TrimSpace(enforcedPowerLimitStr), 64)
		_, _ = strconv.ParseFloat(strings.TrimSpace(powerDefaultLimitStr), 64)

		memTotal, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memTotalStr), " MiB"), 10, 64)
		memUsed, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memUsedStr), " MiB"), 10, 64)
		memFree, _ := strconv.ParseUint(strings.TrimSuffix(strings.TrimSpace(memFreeStr), " MiB"), 10, 64)

		total := memTotal * 1024 * 1024
		used := memUsed * 1024 * 1024
		free := memFree * 1024 * 1024
		percent := float64(used) / float64(total) * 100

		gpus = append(gpus, GPUInfo{
			Name:        name,
			Memory:      GPUMemory{Total: total, Used: used, Free: free, Percent: percent, TotalHuman: FormatBytes(total), UsedHuman: FormatBytes(used)},
			Utilization: utilization,
			Temperature: temperature,
			PowerUsage:  int(powerDraw),
		})
	}

	return gpus
}
