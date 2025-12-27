package config

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
)

// Config 应用配置
type Config struct {
	App struct {
		AppName   string `json:"appName"`
		GithubURL string `json:"githubUrl"`
	} `json:"app"`
	Server struct {
		Host         string   `json:"host"`
		Port         int      `json:"port"`
		CORSOrigins  []string `json:"corsOrigins"`
		CORSMethods  []string `json:"corsMethods"`
		PollInterval int      `json:"pollInterval"`
		HistorySize  int      `json:"historySize"`
	} `json:"server"`
}

var globalConfig *Config

// GetDefault 返回默认配置
func GetDefault() *Config {
	return &Config{
		App: struct {
			AppName   string `json:"appName"`
			GithubURL string `json:"githubUrl"`
		}{
			AppName:   "MLServer_Dash",
			GithubURL: "https://github.com/dat-G/MLServer_Dash",
		},
		Server: struct {
			Host         string   `json:"host"`
			Port         int      `json:"port"`
			CORSOrigins  []string `json:"corsOrigins"`
			CORSMethods  []string `json:"corsMethods"`
			PollInterval int      `json:"pollInterval"`
			HistorySize  int      `json:"historySize"`
		}{
			Host:         "0.0.0.0",
			Port:         8000,
			CORSOrigins:  []string{"*"},
			CORSMethods:  []string{"GET", "POST", "PUT", "DELETE"},
			PollInterval: 2000,
			HistorySize:  30,
		},
	}
}

// Load 加载配置文件
// 首先尝试从可执行文件同目录读取，然后尝试从当前工作目录读取
// 如果配置文件不存在，则创建默认配置文件
func Load() (*Config, error) {
	if globalConfig != nil {
		return globalConfig, nil
	}

	// 获取可执行文件所在目录
	execPath, err := os.Executable()
	if err != nil {
		return nil, err
	}
	execDir := filepath.Dir(execPath)
	configPath := filepath.Join(execDir, "config.json")

	// 如果可执行文件目录找不到，尝试当前工作目录
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configPath = "config.json"
	}

	// 尝试读取配置文件
	data, err := os.ReadFile(configPath)
	if err != nil {
		// 文件不存在，创建默认配置
		if os.IsNotExist(err) {
			log.Printf("Config file not found, creating default config: %s", configPath)
			cfg := GetDefault()

			// 写入默认配置文件
			if err := saveConfig(configPath, cfg); err != nil {
				log.Printf("Warning: failed to save default config: %v", err)
			}

			globalConfig = cfg
			return globalConfig, nil
		}
		return nil, err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	globalConfig = &cfg
	return globalConfig, nil
}

// saveConfig 保存配置到文件
func saveConfig(path string, cfg *Config) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

// Get 获取配置
func Get() *Config {
	if globalConfig == nil {
		cfg, _ := Load()
		return cfg
	}
	return globalConfig
}
