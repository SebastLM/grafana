import { type DataQuery } from '@grafana/schema';
import { type DataSourceJsonData } from '@grafana/data';

export interface DockerQuery extends DataQuery {
    resourceType: 'container_stats' | 'system_df';
    containerId?: string;
} // TODO


export interface DockerOptions extends DataSourceJsonData {
} // TODO