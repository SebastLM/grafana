// ConfigEditor.tsx
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { Alert } from '@grafana/ui';
import { DockerOptions } from '../types';

type Props = DataSourcePluginOptionsEditorProps<DockerOptions>;

export const ConfigEditor = ({ options, onOptionsChange }: Props) => {
  return (
    <>
      <Alert title="TODO" severity="info">TODO implement config editor</Alert>;
    </>
  );
};