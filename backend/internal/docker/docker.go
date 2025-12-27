package docker

import (
	"context"
	"fmt"
	"strings"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"

	"github.com/dat-G/MLServer_Dash/backend/internal/models"
)

var (
	dockerClient *client.Client
	available    bool
)

// Init 初始化Docker客户端
func Init() error {
	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		available = false
		return err
	}

	// 测试连接
	_, err = cli.Ping(context.Background())
	if err != nil {
		available = false
		dockerClient = nil
		return err
	}

	dockerClient = cli
	available = true
	return nil
}

// IsAvailable 检查Docker是否可用
func IsAvailable() bool {
	return available
}

// GetContainers 获取Docker容器列表
func GetContainers() []models.DockerContainer {
	if !available || dockerClient == nil {
		return []models.DockerContainer{}
	}

	containers, err := dockerClient.ContainerList(context.Background(), types.ContainerListOptions{
		All: false, // 只获取运行中的容器
	})
	if err != nil {
		return []models.DockerContainer{}
	}

	var result []models.DockerContainer

	for _, c := range containers {
		// 获取端口映射
		var portStr string
		if len(c.Ports) > 0 {
			ports := ""
			for _, p := range c.Ports {
				if p.PublicPort > 0 {
					ports += fmt.Sprintf("%d:%s/%s ", p.PublicPort, p.Type, p.PrivatePort)
				} else {
					ports += fmt.Sprintf("%s/%s ", p.Type, p.PrivatePort)
				}
			}
			if len(ports) > 0 {
				portStr = ports[:len(ports)-1]
			}
		}
		if portStr == "" {
			portStr = "N/A"
		}

		// 获取镜像名称
		image := c.Image
		if image == "" {
			image = c.ImageID[:12]
		}

		result = append(result, models.DockerContainer{
			ID:     c.ID[:12],
			Name:   strings.TrimPrefix(c.Names[0], "/"),
			Image:  image,
			Status: c.Status,
			Ports:  portStr,
			State:  "running",
		})
	}

	return result
}

// ContainerAction 执行容器操作
func ContainerAction(containerID, action string) models.ActionResponse {
	if !available || dockerClient == nil {
		return models.ActionResponse{
			Success: false,
			Message: "Docker is not available",
		}
	}

	// 获取容器
	_, err := dockerClient.ContainerInspect(context.Background(), containerID)
	if err != nil {
		return models.ActionResponse{
			Success: false,
			Message: fmt.Sprintf("Container %s not found", containerID),
		}
	}

	switch action {
	case "start":
		err := dockerClient.ContainerStart(context.Background(), containerID, types.ContainerStartOptions{})
		if err != nil {
			return models.ActionResponse{
				Success: false,
				Message: err.Error(),
			}
		}
		return models.ActionResponse{
			Success: true,
			Message: fmt.Sprintf("Container %s started", containerID),
		}

	case "stop":
		err := dockerClient.ContainerStop(context.Background(), containerID, container.StopOptions{})
		if err != nil {
			return models.ActionResponse{
				Success: false,
				Message: err.Error(),
			}
		}
		return models.ActionResponse{
			Success: true,
			Message: fmt.Sprintf("Container %s stopped", containerID),
		}

	case "restart":
		err := dockerClient.ContainerRestart(context.Background(), containerID, container.StopOptions{})
		if err != nil {
			return models.ActionResponse{
				Success: false,
				Message: err.Error(),
			}
		}
		return models.ActionResponse{
			Success: true,
			Message: fmt.Sprintf("Container %s restarted", containerID),
		}

	default:
		return models.ActionResponse{
			Success: false,
			Message: fmt.Sprintf("Unknown action: %s", action),
		}
	}
}

// Close 关闭Docker客户端
func Close() {
	if dockerClient != nil {
		dockerClient.Close()
	}
}
