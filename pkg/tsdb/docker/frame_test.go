package docker

import (
    "testing"
)

func TestConvertSystemDF(t *testing.T) {
    input := &SystemDF{
        ImageUsage:      DFUsage{ActiveCount: 2, TotalCount: 5, Reclaimable: 100, TotalSize: 500},
        ContainerUsage:  DFUsage{ActiveCount: 1, TotalCount: 3, Reclaimable: 50, TotalSize: 200},
        VolumeUsage:     DFUsage{ActiveCount: 0, TotalCount: 1, Reclaimable: 10, TotalSize: 10},
        BuildCacheUsage: DFUsage{ActiveCount: 0, TotalCount: 0, Reclaimable: 0, TotalSize: 0},
    }

    frame, err := convertSystemDF(input)
    if err != nil {
        t.Fatalf("convertSystemDF: %v", err)
    }

    // Check the frame has the expected fields and values.
    if frame.Name != "system_df" {
        t.Errorf("frame name: got %q, want system_df", frame.Name)
    }

    categoryField := frame.Fields[0]
    if categoryField.Len() != 4 {
        t.Errorf("expected 4 rows, got %d", categoryField.Len())
    }

    // Spot-check the first row (images).
    if got := frame.Fields[1].At(0); got != int64(2) {
        t.Errorf("images active_count: got %v, want 2", got)
    }
    if got := frame.Fields[4].At(0); got != int64(500) {
        t.Errorf("images total_size: got %v, want 500", got)
    }
}

func TestConvertContainerStats(t *testing.T) {
    input := &ContainerStats{
        // Fill with known values matching your struct shape.
        // CPUStats: CPUStats{CPUUsage: CPUUsage{TotalUsage: 1000000}, OnlineCPUs: 4},
        // MemoryStats: MemoryStats{Usage: 2048, Limit: 8192},
        // Networks: map[string]NetworkStats{"eth0": {RxBytes: 100, TxBytes: 200}},
    }

    frame, err := convertContainerStats(input)
    if err != nil {
        t.Fatalf("convertContainerStats: %v", err)
    }

    if frame.Name != "container_stats" {
        t.Errorf("frame name: got %q, want container_stats", frame.Name)
    }
    // ... spot-check field values ...
    _ = frame
}