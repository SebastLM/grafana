package docker

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/moby/moby/client"
)


type DockerAPI struct {
	cli  *client.Client
	host string
	log  log.Logger
}


func newDockerAPI(host string, opts DockerOptions, secure DockerSecureOptions, logger log.Logger) (*DockerAPI, error) {
	clientOpts := []client.Opt {
		client.WithHost(host),
	}

	if opts.APIVersion != "" {
		clientOpts = append(clientOpts, client.WithVersion(opts.APIVersion))
	}

	if secure.TLSCACert != "" || secure.TLSClientCert != "" {
        tlsConfig, err := buildTLSConfig(secure)
        if err != nil {
            return nil, fmt.Errorf("building TLS config: %w", err)
        }
        httpClient := &http.Client{
            Transport: &http.Transport{TLSClientConfig: tlsConfig},
        }
        clientOpts = append(clientOpts, client.WithHTTPClient(httpClient))
    }

	cli, err := client.New(clientOpts...)
	if err != nil {
		return nil, fmt.Errorf("creating docker client: %w", err)
	}

	return &DockerAPI{cli: cli, host: host, log: logger}, nil
}


func buildTLSConfig(secure DockerSecureOptions) (*tls.Config, error) {
	cert, err := tls.X509KeyPair([]byte(secure.TLSClientCert), []byte(secure.TLSClientKey))
	if err != nil {
		return nil, fmt.Errorf("invalid client cert/key: %w", err)
	}

	caCertPool := x509.NewCertPool()
	if !caCertPool.AppendCertsFromPEM([]byte(secure.TLSCACert)) {
    	return nil, fmt.Errorf("Failed to parse CA certificate")
	}

	return &tls.Config{
				Certificates: []tls.Certificate{cert},
				RootCAs:      caCertPool,
			}, nil
}


func (api *DockerAPI) DataQuery(ctx context.Context, query DockerQuery) (any, error) {
    api.log.Debug("Sending query to docker",
        "resourceType", query.ResourceType,
        "containerId", query.ContainerID,
        "host", api.host,
    )

    switch query.ResourceType {
    case ResourceTypeContainerStats:
        return api.getContainerStats(ctx, query.ContainerID)
    case ResourceTypeSystemDF:
        return api.getSystemDF(ctx)
    default:
        return nil, backend.DownstreamError(fmt.Errorf("unknown resource type: %s", query.ResourceType))
    }
}


func (api *DockerAPI) getContainerStats(ctx context.Context, containerID string) (*ContainerStats, error) {
    if containerID == "" {
        return nil, fmt.Errorf("containerId is required for container_stats")
    }
    resp, err := api.cli.ContainerStats(ctx, containerID, client.ContainerStatsOptions{}) // zero-value gives us Stream: false, which is what we want
    if err != nil {
        return nil, classifyDockerError(err, "fetching container stats")
    }

    defer func() {
		if err := resp.Body.Close(); err != nil {
			api.log.Warn("Failed to close response body", "error", err)
		}
	}()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, backend.DownstreamError(fmt.Errorf("reading stats response: %w", err))
    }
    var stats ContainerStats
    if err := json.Unmarshal(body, &stats); err != nil {
        return nil, backend.DownstreamError(fmt.Errorf("parsing stats response: %w", err))
    }
    return &stats, nil
}


func (api *DockerAPI) getSystemDF(ctx context.Context) (*SystemDF, error) {
    diskUsage, err := api.cli.DiskUsage(ctx, client.DiskUsageOptions{})
    if err != nil {
        return nil, classifyDockerError(err, "fetching disk usage")
    }
    raw, err := json.Marshal(diskUsage)
    if err != nil {
        return nil, backend.DownstreamError(fmt.Errorf("re-encoding disk usage: %w", err))
    }
    var system SystemDF
    if err := json.Unmarshal(raw, &system); err != nil {
        return nil, backend.DownstreamError(fmt.Errorf("parsing disk usage: %w", err))
    }
    return &system, nil
}

// used in streaming.go
func (api *DockerAPI) StreamContainerStats(ctx context.Context, containerID string) (io.ReadCloser, error) {
    if containerID == "" {
        return nil, fmt.Errorf("containerId is required for container_stats")
    }
    resp, err := api.cli.ContainerStats(ctx, containerID, client.ContainerStatsOptions{Stream: true})
    if err != nil {
        return nil, classifyDockerError(err, "fetching container stats")
    }
    return resp.Body, nil
}


// in further use cases have a switch for the different possible errors
// handling each type accordingly to that
func classifyDockerError(err error, op string) error {
    if err == nil {
        return nil
    }
    return backend.DownstreamError(fmt.Errorf("%s: %w", op, err))
}