
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

import { DockerQuery, DockerOptions } from './types';


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


  async getContainers(page : number , limit: number) {
    console.error("this::: ", typeof this.postResource);

    try {
      const containers = await this.getResource<string[]>('/containers', {
      });
      console.error("CONTAINERSSS::: ", containers);
      return containers;

    } catch (err) {
      return Promise.reject(err);
    }

    return [];
  }
}