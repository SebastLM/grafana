import { type DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { type DockerOptions } from '../types';

export function createDefaultDockerOptions(): DataSourcePluginOptionsEditorProps<DockerOptions>['options'] {
  return {
    url: 'http://localhost:2375',
    jsonData: {},
    secureJsonFields: {},
  } as any;
}

export function createConfigEditorProps(
  overrides: Partial<DataSourcePluginOptionsEditorProps<DockerOptions>> = {}
): DataSourcePluginOptionsEditorProps<DockerOptions> {
  return {
    options: createDefaultDockerOptions(),
    onOptionsChange: jest.fn(),
    ...overrides,
  } as DataSourcePluginOptionsEditorProps<DockerOptions>;
}