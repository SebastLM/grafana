package docker

import (
    "context"

    "github.com/grafana/grafana-plugin-sdk-go/backend"
)

func (s *Service) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
    if _, err := s.getDSInfo(ctx, req.PluginContext); err != nil {
        s.logger.Error("failed to get data source info", "error", err)
        return &backend.CheckHealthResult{
            Status:  backend.HealthStatusError,
            Message: "Docker health check failed",
        }, nil
    }

    // TODO: replace with real Docker daemon ping via dsInfo.DockerClient once the client wrapper exists.
    return &backend.CheckHealthResult{
        Status:  backend.HealthStatusOk,
        Message: "Plugin loaded (real health check pending)",
    }, nil
}
