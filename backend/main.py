"""
Backend - 提供系统资源监控和Docker容器管理的API接口
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psutil
import docker
import platform
import os
import cpuinfo
import subprocess
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

# 加载配置文件
def load_config():
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'config.json')
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

config = load_config()
APP_TITLE = config['app']['appName']
APP_NAME = config['app']['appName']
GITHUB_URL = config['app'].get('githubUrl', '')
CORS_ORIGINS = config['backend']['corsOrigins']
CORS_METHODS = config['backend']['corsMethods']
POLL_INTERVAL = config['backend']['pollInterval']
HISTORY_SIZE = config['backend']['historySize']

# 尝试导入NVIDIA GPU监控库
_pynvml = None
GPU_AVAILABLE = False
try:
    import pynvml as _pynvml
    _pynvml.nvmlInit()
    GPU_AVAILABLE = True
except ImportError:
    # pynvml未安装
    GPU_AVAILABLE = False
except Exception:
    # pynvml已安装但初始化失败（例如系统没有NVIDIA GPU或驱动问题）
    GPU_AVAILABLE = False

app = FastAPI(title=f"{APP_TITLE} API", version="1.0.0")

# CORS配置 - 从配置文件读取
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=CORS_METHODS,
    allow_headers=["*"],
)

# Docker客户端初始化
try:
    docker_client = docker.from_env()
    DOCKER_AVAILABLE = True
except docker.errors.DockerException:
    DOCKER_AVAILABLE = False
    docker_client = None
except Exception:
    # Docker未安装或未运行
    DOCKER_AVAILABLE = False
    docker_client = None


# ==================== 数据模型 ====================

class GPUMemory(BaseModel):
    total: int
    used: int
    free: int
    percent: float
    total_human: str
    used_human: str


class GPUInfo(BaseModel):
    name: str
    memory: GPUMemory
    utilization: float
    temperature: int  # 温度（摄氏度）
    power_usage: int  # 当前功耗（毫瓦）
    power_tdp: int  # TDP（毫瓦）


class CPUInfo(BaseModel):
    brand: str
    percent: float
    cores: int  # 物理核心数
    threads: int  # 逻辑核心数（线程数）
    per_core_percent: List[float]


class MemoryInfo(BaseModel):
    total: int
    used: int
    free: int
    percent: float
    total_human: str
    used_human: str
    free_human: str
    model: Optional[str] = None  # 内存型号


class DiskInfo(BaseModel):
    name: str
    total: int
    used: int
    free: int
    percent: float
    total_human: str
    used_human: str
    free_human: str


class NetworkInterface(BaseModel):
    name: str
    model: Optional[str] = None  # 网卡型号
    speed: Optional[int] = None  # 网卡速率（Mbps）
    ipv4: Optional[str] = None  # IPv4地址
    ipv6: Optional[str] = None  # IPv6地址
    bytes_sent: int
    bytes_recv: int
    packets_sent: int
    packets_recv: int
    errors_in: int
    errors_out: int
    drops_in: int
    drops_out: int
    speed_up: Optional[float] = None  # 上行速度（字节/秒）
    speed_down: Optional[float] = None  # 下行速度（字节/秒）


class SystemInfo(BaseModel):
    hostname: str
    os: str
    distro: Optional[Dict[str, str]] = None
    cpu: CPUInfo
    memory: MemoryInfo
    disks: List[DiskInfo]
    uptime: int
    gpu: Optional[List[GPUInfo]] = None
    network: Optional[List[NetworkInterface]] = None


class DockerContainer(BaseModel):
    id: str
    name: str
    image: str
    status: str
    ports: str
    state: str


class ActionResponse(BaseModel):
    success: bool
    message: str


# ==================== 辅助函数 ====================

# 全局变量：存储上次的网络统计信息
_last_network_stats = {}
_last_network_time = None


def get_network_info() -> List[Dict[str, Any]]:
    """获取网络接口信息"""
    global _last_network_stats, _last_network_time

    import time
    import os
    current_time = time.time()
    interfaces = []

    # 获取网络IO统计
    net_io = psutil.net_io_counters(pernic=True)

    # 过滤出物理网卡
    physical_interfaces = []
    for name, stats in net_io.items():
        # 跳过本地回环和虚拟接口
        if name == 'lo':
            continue
        if name.startswith('veth') or name.startswith('docker') or name.startswith('br-'):
            continue
        if name.startswith('virbr') or name.startswith('vnet'):
            continue
        physical_interfaces.append(name)

    for name in physical_interfaces:
        stats = net_io.get(name)
        if not stats:
            continue

        # 获取网卡速率（从 /sys/class/net/<name>/speed）
        speed = None
        speed_path = f'/sys/class/net/{name}/speed'
        if os.path.exists(speed_path):
            try:
                with open(speed_path, 'r') as f:
                    speed_val = f.read().strip()
                    if speed_val and speed_val != '-1':
                        speed = int(speed_val)
            except (OSError, IOError, ValueError):
                pass

        # 获取网卡型号
        model = None
        # 尝试从 /sys/class/net/<name>/device/ 获取信息
        device_path = f'/sys/class/net/{name}/device'
        if os.path.exists(device_path):
            # 尝试读取 uevent 文件
            uevent_path = os.path.join(device_path, 'uevent')
            if os.path.exists(uevent_path):
                try:
                    with open(uevent_path, 'r') as f:
                        for line in f:
                            if line.startswith('PRODUCT='):
                                # 格式通常是 vendor/product/revision
                                parts = line.split('=', 1)[1].strip().split('/')
                                if len(parts) >= 2:
                                    vendor_hex = parts[0]
                                    product_hex = parts[1]
                                    model = f'{vendor_hex}:{product_hex}'
                                break
                except (OSError, IOError):
                    pass

        # 如果没有找到型号，尝试读取其他信息
        if not model:
            # 尝试从 driver 模块获取
            driver_path = f'/sys/class/net/{name}/device/driver/module'
            if os.path.exists(driver_path):
                try:
                    driver_name = os.path.basename(os.readlink(driver_path))
                    model = driver_name
                except (OSError, IOError):
                    pass

        # 获取IP地址
        ipv4 = None
        ipv6 = None
        try:
            import socket
            net_addrs = psutil.net_if_addrs()
            if name in net_addrs:
                for addr in net_addrs[name]:
                    if addr.family == socket.AF_INET:  # IPv4
                        ipv4 = addr.address
                    elif addr.family == socket.AF_INET6:  # IPv6
                        # 只取第一个非本地链路的IPv6地址
                        if ipv6 is None and not addr.address.startswith('fe80:') and not addr.address.startswith('::1') and not addr.address.startswith('127.'):
                            ipv6 = addr.address.split('%')[0]  # 移除接口标识符
        except (OSError, AttributeError):
            pass

        speed_up = None
        speed_down = None

        # 计算速度（如果有上次数据）
        if name in _last_network_stats and _last_network_time is not None:
            time_diff = current_time - _last_network_time
            if time_diff > 0:
                last_stats = _last_network_stats[name]
                bytes_sent_diff = stats.bytes_sent - last_stats.bytes_sent
                bytes_recv_diff = stats.bytes_recv - last_stats.bytes_recv
                speed_up = bytes_sent_diff / time_diff if bytes_sent_diff >= 0 else 0
                speed_down = bytes_recv_diff / time_diff if bytes_recv_diff >= 0 else 0

        interfaces.append({
            "name": name,
            "model": model,
            "speed": speed,
            "ipv4": ipv4,
            "ipv6": ipv6,
            "bytes_sent": stats.bytes_sent,
            "bytes_recv": stats.bytes_recv,
            "packets_sent": stats.packets_sent,
            "packets_recv": stats.packets_recv,
            "errors_in": stats.errin,
            "errors_out": stats.errout,
            "drops_in": stats.dropin,
            "drops_out": stats.dropout,
            "speed_up": speed_up,
            "speed_down": speed_down
        })

    # 更新上次统计
    _last_network_stats = {name: net_io[name] for name in physical_interfaces if name in net_io}
    _last_network_time = current_time

    return interfaces


def get_distro_info() -> Dict[str, str]:
    """获取Linux发行版信息"""
    result = {"name": None, "id": None}

    try:
        import distro
        result["name"] = distro.name(pretty=True)
        result["id"] = distro.id()
    except ImportError:
        pass

    # 如果 distro 模块不可用，尝试读取 /etc/os-release
    if not result["name"]:
        try:
            with open('/etc/os-release', 'r') as f:
                for line in f:
                    if line.startswith('PRETTY_NAME='):
                        value = line.split('=', 1)[1].strip()
                        # 移除引号
                        value = value.strip('"').strip("'")
                        result["name"] = value
                    elif line.startswith('ID='):
                        value = line.split('=', 1)[1].strip()
                        value = value.strip('"').strip("'")
                        result["id"] = value.lower()
        except (OSError, IOError):
            pass

    return result


def get_cpu_info() -> Dict[str, Any]:
    """获取CPU信息"""
    try:
        cpu_brand = cpuinfo.get_cpu_info()['brand_raw']
    except (KeyError, TypeError, AttributeError):
        cpu_brand = platform.processor() or "Unknown CPU"

    # 获取物理核心数和逻辑核心数（线程数）
    physical_cores = psutil.cpu_count(logical=False)
    logical_cores = psutil.cpu_count(logical=True)

    # 使用psutil的cpu_percent API获取每个核心的占用率
    # 第一次调用会初始化内部缓存，返回0
    per_core_percent = list(psutil.cpu_percent(percpu=True))

    # 从核心占用率计算总体占用率（与htop一致）
    cpu_percent = sum(per_core_percent) / len(per_core_percent) if per_core_percent else 0.0

    return {
        "brand": cpu_brand,
        "percent": cpu_percent,
        "cores": physical_cores,
        "threads": logical_cores,
        "per_core_percent": per_core_percent
    }


def get_gpu_info() -> List[Dict[str, Any]]:
    """获取GPU信息"""
    if not GPU_AVAILABLE or _pynvml is None:
        return []

    gpu_list = []
    try:
        device_count = _pynvml.nvmlDeviceGetCount()
        for i in range(device_count):
            handle = _pynvml.nvmlDeviceGetHandleByIndex(i)

            # GPU名称
            name = _pynvml.nvmlDeviceGetName(handle)
            if isinstance(name, bytes):
                name = name.decode('utf-8')

            # 显存信息
            mem_info = _pynvml.nvmlDeviceGetMemoryInfo(handle)

            # GPU利用率
            try:
                utilization = _pynvml.nvmlDeviceGetUtilizationRates(handle)
                gpu_util = utilization.gpu
            except _pynvml.NVMLError:
                gpu_util = 0

            # 温度
            try:
                temperature = _pynvml.nvmlDeviceGetTemperature(handle, _pynvml.NVML_TEMPERATURE_GPU)
            except _pynvml.NVMLError:
                temperature = 0

            # 电源使用和TDP
            try:
                power_usage = _pynvml.nvmlDeviceGetPowerUsage(handle)  # 毫瓦
            except _pynvml.NVMLError:
                power_usage = 0

            try:
                power_tdp = _pynvml.nvmlDeviceGetEnforcedPowerLimit(handle)  # 毫瓦
            except _pynvml.NVMLError:
                power_tdp = 0

            gpu_list.append({
                "name": name,
                "memory": {
                    "total": mem_info.total,
                    "used": mem_info.used,
                    "free": mem_info.free,
                    "percent": round((mem_info.used / mem_info.total) * 100, 2),
                    "total_human": format_bytes(mem_info.total),
                    "used_human": format_bytes(mem_info.used)
                },
                "utilization": gpu_util,
                "temperature": temperature,
                "power_usage": power_usage,
                "power_tdp": power_tdp
            })
    except _pynvml.NVMLError as e:
        print(f"Error getting GPU info: {e}")

    return gpu_list


def get_docker_containers() -> List[Dict[str, Any]]:
    """获取Docker容器列表"""
    if not DOCKER_AVAILABLE:
        return []

    containers = []
    try:
        for container in docker_client.containers.list(all=False):  # 只获取运行中的容器
            # 获取端口映射
            ports = container.attrs.get('NetworkSettings', {}).get('Ports', {})
            port_list = []
            for container_port, host_bindings in ports.items():
                if host_bindings:
                    for binding in host_bindings:
                        port_list.append(f"{binding.get('HostPort', '')}:{container_port}")
                else:
                    port_list.append(container_port)

            # 确定容器状态
            state = container.attrs.get('State', {})
            status = state.get('Status', 'unknown')
            running = status == 'running'

            containers.append({
                "id": container.short_id,
                "name": container.name,
                "image": container.image.tags[0] if container.image.tags else container.image.id[:12],
                "status": status,
                "state": "running" if running else "stopped",
                "ports": ", ".join(port_list) if port_list else "N/A"
            })
    except Exception as e:
        print(f"Error getting docker containers: {e}")

    return containers


def get_memory_model() -> Optional[str]:
    """获取内存型号信息"""
    # 尝试直接运行 dmidecode（不使用sudo，只有有权限时才成功）
    try:
        result = subprocess.run(
            ['dmidecode', '-t', 'memory'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            output = result.stdout
            # 查找内存设备信息
            in_memory_device = False
            for line in output.split('\n'):
                line = line.strip()
                if line.startswith('Memory Device'):
                    in_memory_device = True
                    continue
                if in_memory_device:
                    if line.startswith('Size:') and 'GB' in line and 'No Module Installed' not in line:
                        # 找到有效的内存条，继续查找型号信息
                        pass
                    if line.startswith('Part Number:'):
                        value = line.split(':', 1)[1].strip()
                        if value and value not in ['None', 'Unknown', 'To Be Filled By O.E.M.']:
                            return f"PN: {value}"
                    if line.startswith('Manufacturer:'):
                        value = line.split(':', 1)[1].strip()
                        if value and value not in ['None', 'Unknown', 'To Be Filled By O.E.M.']:
                            return value
                    if line == '':
                        in_memory_device = False
    except (FileNotFoundError, PermissionError, subprocess.TimeoutExpired):
        pass
    except (OSError, subprocess.SubprocessError):
        pass

    return None


def get_disk_info() -> List[Dict[str, Any]]:
    """获取物理磁盘信息"""
    disks = []
    device_sizes = {}

    import os

    # 从 /sys/block 获取物理磁盘设备
    sys_block_path = '/sys/block'
    if os.path.exists(sys_block_path):
        for device in os.listdir(sys_block_path):
            device_path = os.path.join(sys_block_path, device)

            # 跳过虚拟设备和loop设备
            if device.startswith('loop') or device.startswith('sr') or device.startswith('fd'):
                continue

            # 检查是否是物理设备（device目录下的dev文件存在）
            device_subsystem = os.path.join(device_path, 'device', 'subsystem')
            if os.path.exists(device_subsystem):
                # 读取磁盘大小（扇区数 * 512）
                size_file = os.path.join(device_path, 'size')
                if os.path.exists(size_file):
                    try:
                        with open(size_file, 'r') as f:
                            sectors = int(f.read().strip())
                            size_bytes = sectors * 512
                            device_sizes[device] = size_bytes
                    except (OSError, IOError, ValueError):
                        pass

    # 如果获取到了物理磁盘，尝试匹配挂载点获取使用情况
    partitions = psutil.disk_partitions()
    processed_devices = set()

    for partition in partitions:
        try:
            # 跳过一些特殊文件系统
            if partition.fstype in ['squashfs', 'tmpfs', 'proc', 'sysfs', 'devtmpfs', 'devpts', 'cgroup', 'configfs']:
                continue

            # 提取设备名（如 sda1, nvme0n1p1 -> sda, nvme0n1）
            device_name = partition.device.split('/')[-1]

            # 去掉分区号，获取基础设备名
            base_device = device_name
            for pattern in ['p[0-9]+$', '[0-9]+$']:
                import re
                match = re.sub(pattern, '', device_name)
                if match != device_name:
                    base_device = match
                    break

            # 如果是已处理的设备，跳过
            if base_device in processed_devices:
                continue

            # 获取使用情况
            usage = psutil.disk_usage(partition.mountpoint)

            # 获取物理磁盘大小（如果有）
            total_size = usage.total
            if base_device in device_sizes:
                total_size = device_sizes[base_device]

            # 获取磁盘型号（从 /sys/block/设备/device/model）
            model = base_device.upper()
            model_path = f'/sys/block/{base_device}/device/model'
            if os.path.exists(model_path):
                try:
                    with open(model_path, 'r') as f:
                        model = f.read().strip()
                except (OSError, IOError):
                    pass

            disks.append({
                "name": model if model else base_device.upper(),
                "total": total_size,
                "used": usage.used,
                "free": total_size - usage.used,
                "percent": (usage.used / total_size * 100) if total_size > 0 else 0,
                "total_human": format_bytes(total_size),
                "used_human": format_bytes(usage.used),
                "free_human": format_bytes(total_size - usage.used)
            })

            processed_devices.add(base_device)

        except PermissionError:
            continue
        except (OSError, psutil.Error):
            continue

    # 备用方案：如果没有找到磁盘，使用根目录
    if not disks:
        try:
            usage = psutil.disk_usage('/')
            disks.append({
                "name": "Root Disk",
                "total": usage.total,
                "used": usage.used,
                "free": usage.free,
                "percent": usage.percent,
                "total_human": format_bytes(usage.total),
                "used_human": format_bytes(usage.used),
                "free_human": format_bytes(usage.free)
            })
        except (OSError, psutil.Error):
            pass

    return disks


def format_bytes(bytes_value: int) -> str:
    """格式化字节数为可读格式"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def get_uptime() -> int:
    """获取系统运行时间（秒）"""
    boot_time = psutil.boot_time()
    uptime_seconds = int(datetime.now().timestamp() - boot_time)
    return uptime_seconds


# ==================== API 路由 ====================

@app.get("/", response_model=Dict[str, str])
async def root():
    """根路径"""
    return {
        "message": f"{APP_TITLE} API",
        "version": "1.0.0",
        "endpoints": {
            "system": "/api/system",
            "docker": "/api/docker",
            "docker/action": "/api/docker/{container_id}/action"
        }
    }


@app.get("/api/system", response_model=SystemInfo)
async def get_system_info():
    """获取系统信息"""
    # CPU信息
    cpu_info = get_cpu_info()

    # 内存信息
    memory = psutil.virtual_memory()
    memory_model = get_memory_model()
    memory_info = {
        "total": memory.total,
        "used": memory.used,
        "free": memory.free,
        "percent": memory.percent,
        "total_human": format_bytes(memory.total),
        "used_human": format_bytes(memory.used),
        "free_human": format_bytes(memory.free),
        "model": memory_model
    }

    # 磁盘信息
    disk_info = get_disk_info()

    # GPU信息
    gpu_info = get_gpu_info()

    # 网络信息
    network_info = get_network_info()

    # 发行版信息
    distro_info = get_distro_info()

    return {
        "hostname": platform.node(),
        "os": f"{platform.system()} {platform.release()}",
        "distro": distro_info,
        "cpu": cpu_info,
        "memory": memory_info,
        "disks": disk_info,
        "uptime": get_uptime(),
        "gpu": gpu_info if gpu_info else None,
        "network": network_info if network_info else None
    }


@app.get("/api/docker", response_model=List[DockerContainer])
async def get_docker_info():
    """获取Docker容器列表"""
    return get_docker_containers()


@app.post("/api/docker/{container_id}/action", response_model=ActionResponse)
async def container_action(container_id: str, action: str):
    """
    执行容器操作
    action: start, stop, restart
    """
    if not DOCKER_AVAILABLE:
        raise HTTPException(status_code=503, detail="Docker is not available")

    try:
        container = docker_client.containers.get(container_id)

        if action == "start":
            container.start()
            return {"success": True, "message": f"Container {container_id} started"}
        elif action == "stop":
            container.stop()
            return {"success": True, "message": f"Container {container_id} stopped"}
        elif action == "restart":
            container.restart()
            return {"success": True, "message": f"Container {container_id} restarted"}
        else:
            return {"success": False, "message": f"Unknown action: {action}"}

    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Container {container_id} not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "docker_available": DOCKER_AVAILABLE,
        "gpu_available": GPU_AVAILABLE
    }


if __name__ == "__main__":
    import uvicorn
    print(f"{APP_NAME} Backend starting...")
    print(f"API: http://0.0.0.0:8000")
    print(f"Docs: http://localhost:8000/docs")
    if GITHUB_URL:
        print(f"GitHub: {GITHUB_URL}")
    print()
    uvicorn.run(app, host="0.0.0.0", port=8000)
