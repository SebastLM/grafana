
import { Observable, of } from 'rxjs';

import {
  DataSourceWithQueryExportSupport,
  AbstractQuery,
  DataQueryRequest,
  DataQueryResponse
} from '@grafana/data';
import {
  DataSourceWithBackend,
} from '@grafana/runtime';

import { DockerQuery, DockerOptions, DockerContainer, ContainerOption } from './types';


export default class DockerDatasource
  extends DataSourceWithBackend<DockerQuery, DockerOptions>
  implements DataSourceWithQueryExportSupport<DockerQuery>
{
  type: 'docker';
  url: string;
  name: string;
  withCredentials: boolean;
  basicAuth: string;
  
  // TODO
  constructor(
    instanceSettings: any,
  ) {
    super(instanceSettings);
    this.type = 'docker';
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.withCredentials = instanceSettings.withCredentials;
    this.basicAuth = instanceSettings.basicAuth;
    instanceSettings.jsonData = instanceSettings.jsonData || {};
  }

  query(options: DataQueryRequest<DockerQuery>): Observable<DataQueryResponse> {
    const target = options.targets[0];

    const fixedRequest: DataQueryRequest<DockerQuery> = {
      ...options
    };

    if (!target || target.hide) {
      return of({ data: [] });
    }

    return super.query(fixedRequest);
  }

  exportToAbstractQueries(queries: DockerQuery[]): Promise<AbstractQuery[]> {
    return Promise.resolve([]);
  }


  async getContainers(page: number, limit: number): Promise<ContainerOption[]> {
    const containers = await this.getResource<DockerContainer[]>('/containers', {});

    return containers.map((c) => ({
      label: c.Names?.[0] ?? c.Id,
      value: c.Id,
    }));
  }
}