package docker

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"go.opentelemetry.io/otel/trace"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)


type Service struct {
	im				instancemgmt.InstanceManager
	tracer			trace.Tracer
	logger			log.Logger
	resourceHandler backend.CallResourceHandler
}


var (
	_ backend.QueryDataHandler    = (*Service)(nil)
	_ backend.CallResourceHandler = (*Service)(nil)
	_ backend.CheckHealthHandler  = (*Service)(nil)
    // TODO: add `_ backend.StreamHandler = (*Service)(nil)`	
)


func ProvideService(httpClientProvider *httpclient.Provider, tracer trace.Tracer) *Service {
	logger := backend.NewLoggerWith("logger", "tsdb.docker")
	s := &Service{
		im:      datasource.NewInstanceManager(newInstanceSettings(httpClientProvider, logger)),
		tracer:  tracer,
		logger:  logger,
	}
	s.resourceHandler = httpadapter.New(s.newResourceMux())
	return s
}


type datasourceInfo struct {
	HTTPClient *http.Client // unused for now
	URL        string
	Options    DockerOptions
	SecureOpts DockerSecureOptions
	API		   *DockerAPI
	/* TODO:
		- add stream caches when streaming is implemented:
			// streams   map[string]data.FrameJSONCache
			// streamsMu sync.RWMutex
	*/
}


func  newInstanceSettings(httpClientProvider *httpclient.Provider, logger log.Logger) datasource.InstanceFactoryFunc {
	return func(ctx context.Context, settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
		var dockerOpts DockerOptions
        if len(settings.JSONData) > 0 {
            if err := json.Unmarshal(settings.JSONData, &dockerOpts); err != nil {
                return nil, fmt.Errorf("parsing settings: %w", err)
            }
        }

        secureOpts := DockerSecureOptions{
            TLSCACert:     settings.DecryptedSecureJSONData["tlsCACert"],
            TLSClientCert: settings.DecryptedSecureJSONData["tlsClientCert"],
            TLSClientKey:  settings.DecryptedSecureJSONData["tlsClientKey"],
        }

        api, err := newDockerAPI(dockerOpts, secureOpts, logger)
        if err != nil {
            return nil, fmt.Errorf("creating docker api: %w", err)
        }

		opts, err := settings.HTTPClientOptions(ctx)
		if err != nil {
			return nil, fmt.Errorf("http client options: %w", err)
		}
		client, err := httpClientProvider.New(opts)
		if err != nil {
			return nil, fmt.Errorf("creating http client: %w", err)
		}

        return &datasourceInfo{
			HTTPClient: client,
            URL:        settings.URL,
            Options:    dockerOpts,
            SecureOpts: secureOpts,
            API:        api,
        }, nil
    }
}


func (s *Service) getDSInfo(ctx context.Context, pluginCtx backend.PluginContext) (*datasourceInfo, error) {
	i, err := s.im.Get(ctx, pluginCtx)
	if err != nil {
		return nil, err
	}
	instance := i.(*datasourceInfo)
	return instance, nil
}


func (s *Service) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	logger := s.logger.FromContext(ctx)

	if len(req.Queries) == 0 {
		return nil, fmt.Errorf("query is empty")
	}
	dsInfo, err := s.getDSInfo(ctx, req.PluginContext)
	if err != nil {
		logger.Error("Failed to get data source info", "error", err)
		return nil, err
	}
	response := backend.NewQueryDataResponse()
    for _, q := range req.Queries {
        response.Responses[q.RefID] = s.handleQuery(ctx, dsInfo, q)
    }

	return response, nil
}


func (s *Service) handleQuery(ctx context.Context, dsInfo *datasourceInfo, query backend.DataQuery) backend.DataResponse {
	logger := s.logger.FromContext(ctx)
	
	parsed, err := parseQuery(query)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, err.Error())
	}
	
	resp, err := dsInfo.API.DataQuery(ctx, *parsed);
	if err != nil {
		logger.Error("Failed to perform the query", "error", err)
		return backend.ErrDataResponse(backend.StatusInternal, err.Error())
	}

	frame, err := ResponseParser(resp)
	if err != nil {
		logger.Error("Failed to convert query response into frames", "error", err)
		return backend.ErrDataResponse(backend.StatusInternal, err.Error())
	}
    return frame
}


func (s *Service) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return s.resourceHandler.CallResource(ctx, req, sender)
}


// TODO: move newResourceMux to resource<...>.go and register real handlers like:
//   mux.HandleFunc("/containers", s.handleListContainers)
//   mux.HandleFunc("/version",    s.handleVersion)
func (s *Service) newResourceMux() *http.ServeMux {
	return http.NewServeMux()
}
