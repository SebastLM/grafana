package docker

import (
    "fmt"
    "reflect"
    "time"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
    "github.com/grafana/grafana-plugin-sdk-go/data"
)


type converter func(resp any) (*data.Frame, error)


var converters = map[reflect.Type]converter{
    reflect.TypeOf((*ContainerStats)(nil)): convertContainerStats,
    reflect.TypeOf((*SystemDF)(nil)):       convertSystemDF,
}


func ResponseParser(resp any) (backend.DataResponse, error) {
    if resp == nil {
        return backend.DataResponse{}, fmt.Errorf("nil response")
    }

    conv, ok := converters[reflect.TypeOf(resp)]
    if !ok {
        return backend.DataResponse{}, fmt.Errorf("no converter registered for type %T", resp)
    }

    frame, err := conv(resp)
    if err != nil {
        return backend.DataResponse{}, fmt.Errorf("%T: %w", resp, err)
    }
    return backend.DataResponse{Frames: data.Frames{frame}}, nil
}


func convertContainerStats(resp any) (*data.Frame, error) {
    stats, ok := resp.(*ContainerStats)
    if !ok || stats == nil {
        return nil, fmt.Errorf("expected *ContainerStats, got %T", resp)
    }

    now := time.Now()
    netStats := sumNetworkStats(stats.Networks)

    return data.NewFrame("container_stats",
        data.NewField("time", nil, []time.Time{now}),
        data.NewField("cpu_total_usage_ns", nil, []uint64{stats.CPUStats.CPUUsage.TotalUsage}),
        data.NewField("online_cpus", nil, []int64{int64(stats.CPUStats.OnlineCPUs)}),
        data.NewField("memory_used_bytes", nil, []uint64{stats.MemoryStats.Usage}),
        data.NewField("memory_max_used_bytes", nil, []uint64{stats.MemoryStats.MaxUsage}),
        data.NewField("memory_limit_bytes", nil, []uint64{stats.MemoryStats.Limit}),
        data.NewField("network_rx_bytes", nil, []uint64{netStats.RxBytes}),
        data.NewField("network_rx_packets", nil, []uint64{netStats.RxPackets}),
        data.NewField("network_rx_errors", nil, []uint64{netStats.RxErrors}),
        data.NewField("network_rx_dropped", nil, []uint64{netStats.RxDropped}),
        data.NewField("network_tx_bytes", nil, []uint64{netStats.TxBytes}),
        data.NewField("network_tx_packets", nil, []uint64{netStats.TxPackets}),
        data.NewField("network_tx_errors", nil, []uint64{netStats.TxErrors}),
        data.NewField("network_tx_dropped", nil, []uint64{netStats.TxDropped}),
    ), nil
}


func convertSystemDF(resp any) (*data.Frame, error) {
    df, ok := resp.(*SystemDF)
    if !ok || df == nil {
        return nil, fmt.Errorf("expected *SystemDF, got %T", resp)
    }

    categories := []string{"images", "containers", "volumes", "build_cache"}
    usages := []DFUsage{df.ImageUsage, df.ContainerUsage, df.VolumeUsage, df.BuildCacheUsage}

    n := len(categories)
    activeCounts := make([]int64, n)
    totalCounts := make([]int64, n)
    reclaimables := make([]int64, n)
    totalSizes := make([]int64, n)

    for i, u := range usages {
        activeCounts[i] = int64(u.ActiveCount)
        totalCounts[i] = int64(u.TotalCount)
        reclaimables[i] = u.Reclaimable
        totalSizes[i] = u.TotalSize
    }

    return data.NewFrame("system_df",
        data.NewField("category", nil, categories),
        data.NewField("active_count", nil, activeCounts),
        data.NewField("total_count", nil, totalCounts),
        data.NewField("reclaimable_bytes", nil, reclaimables),
        data.NewField("total_size_bytes", nil, totalSizes),
    ), nil
}


func sumNetworkStats(networks map[string]NetworkStats) NetworkStats {
    var total NetworkStats
    for _, n := range networks {
        total.RxBytes += n.RxBytes
        total.RxPackets += n.RxPackets
        total.RxErrors += n.RxErrors
        total.RxDropped += n.RxDropped
        total.TxBytes += n.TxBytes
        total.TxPackets += n.TxPackets
        total.TxErrors += n.TxErrors
        total.TxDropped += n.TxDropped
    }
    return total
}