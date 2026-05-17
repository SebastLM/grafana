import {
  DataSourceWithQueryExportSupport,
  AbstractQuery,
} from '@grafana/data';

import { DataSourceWithBackend } from '@grafana/runtime';

import { DockerQuery, DockerOptions } from './types';

export class DockerDatasource
  extends DataSourceWithBackend<DockerQuery, DockerOptions>
  implements DataSourceWithQueryExportSupport<DockerQuery>
{

  // TODO

  exportToAbstractQueries(queries: DockerQuery[]): Promise<AbstractQuery[]> {
    return Promise.resolve([]);
  }
}