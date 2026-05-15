package docker

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net/http"

	"github.com/moby/moby/client"
)


type DockerAPI struct {
	cli *client.Client
}

/*
type DockerResponse {
	Body []byte
}
*/

func newDockerAPI(opts DockerOptions, secure DockerSecureOptions) (*DockerAPI, error) {
	clientOpts := []client.Opt {
		client.WithHost(opts.Host),
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

	return &DockerAPI{cli: cli}, nil
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
