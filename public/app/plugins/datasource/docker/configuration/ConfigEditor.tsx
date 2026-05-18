import { 
  type DataSourcePluginOptionsEditorProps,
} from '@grafana/data';
import { config } from '@grafana/runtime';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DockerOptions } from '../types';

export const ConfigEditor = (props: DataSourcePluginOptionsEditorProps<DockerOptions>) => {
  const { options, onOptionsChange } = props;

  return (
    <>
      <DataSourceHttpSettings
        defaultUrl="http://localhost:2375"
        dataSourceConfig={options}
        onChange={(newOptions) => {
          console.log('[Docker DataSource] onOptionsChange:', newOptions);
          onOptionsChange(newOptions);
        }}
        secureSocksDSProxyEnabled={config.secureSocksDSProxyEnabled}
      />
    </>
  );
};