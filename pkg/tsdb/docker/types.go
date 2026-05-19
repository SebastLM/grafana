package docker

// ---- Settings ----

type DockerOptions struct {
	APIVersion string `json:"apiVersion,omitempty"`
}

type DockerSecureOptions struct {
	TLSCACert     string
	TLSClientCert string
	TLSClientKey  string
}

// ---- Query ----

const (
	ResourceTypeContainerStats = "container_stats"
	ResourceTypeSystemDF       = "system_df"
)


type DockerQuery struct {
	ResourceType string `json:"resourceType"`
	ContainerID  string `json:"containerId,omitempty"`
	// add more in future
}


// from GET /containers/{id}/stats
type ContainerStats struct {
	CPUStats    CPUStats               `json:"cpu_stats"`
	MemoryStats MemoryStats            `json:"memory_stats"`
	Networks    map[string]NetworkStats `json:"networks"`
}

type CPUStats struct {
	CPUUsage   CPUUsage `json:"cpu_usage"`
	OnlineCPUs int      `json:"online_cpus"`
}

type CPUUsage struct {
	TotalUsage uint64 `json:"total_usage"`
}

type MemoryStats struct {
	Usage    uint64 `json:"usage"`
	MaxUsage uint64 `json:"max_usage"`
	Limit    uint64 `json:"limit"`
}

type NetworkStats struct {
    RxBytes   uint64 `json:"rx_bytes"`
    RxPackets uint64 `json:"rx_packets"`
    RxErrors  uint64 `json:"rx_errors"`
    RxDropped uint64 `json:"rx_dropped"`
    TxBytes   uint64 `json:"tx_bytes"`
    TxPackets uint64 `json:"tx_packets"`
    TxErrors  uint64 `json:"tx_errors"`
    TxDropped uint64 `json:"tx_dropped"`
}



// from GET /system/df
type SystemDF struct {
	ImageUsage      DFUsage `json:"ImageUsage"`
	ContainerUsage  DFUsage `json:"ContainerUsage"`
	VolumeUsage     DFUsage `json:"VolumeUsage"`
	BuildCacheUsage DFUsage `json:"BuildCacheUsage"`
}

// shared by all df categories
type DFUsage struct {
	ActiveCount int   `json:"ActiveCount"`
	TotalCount  int   `json:"TotalCount"`
	Reclaimable int64 `json:"Reclaimable"`
	TotalSize   int64 `json:"TotalSize"`
}


// from Get /containers/json
type GetContainers struct {
	Id string `json:"Id"`
	Names []string `json:"Names"`
}