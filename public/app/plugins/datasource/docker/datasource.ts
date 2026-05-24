import { Observable, of, merge } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  DataSourceWithQueryExportSupport,
  AbstractQuery,
  DataQueryRequest,
  DataQueryResponse,
  DataFrame,
  FieldType,
  toDataFrame,
} from '@grafana/data';

import { DataSourceWithBackend } from '@grafana/runtime';

import {
  DockerQuery,
  DockerOptions,
  DockerContainer,
  ContainerOption,
} from './types';

import { doDockerChannelStream } from './streaming';

export default class DockerDatasource
  extends DataSourceWithBackend<DockerQuery, DockerOptions>
  implements DataSourceWithQueryExportSupport<DockerQuery>
{
  type: 'docker';
  url: string;
  name: string;
  withCredentials: boolean;
  basicAuth: string;

  private readonly MAX_POINTS = 500;

  private frameBuffer: Record<string, Map<string, DataFrame>> = {};

  constructor(instanceSettings: any) {
    super(instanceSettings);

    this.type = 'docker';
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.withCredentials = instanceSettings.withCredentials;
    this.basicAuth = instanceSettings.basicAuth;

    instanceSettings.jsonData = instanceSettings.jsonData || {};
  }


  query(options: DataQueryRequest<DockerQuery>): Observable<DataQueryResponse> {
    const targets = options.targets.filter((t) => !t.hide);

    if (targets.length === 0) {
        return of({ data: [] });
    }

    const observables = targets.map((target) => {
      if (
          target.resourceType === 'container_stats' &&
          target.containerId &&
          target.streaming
      ) {
          return doDockerChannelStream(target, this, options);
      }
      return super.query({ ...options, targets: [target] }).pipe(
            map((res) => {
              const refId = target.refId ?? 'A';
              const merged = target.resourceType === 'container_stats' ? 
                  this.mergeIntoBuffer(refId, res.data)
                  : res.data;
              
              return { ...res, data: merged };
        })
      );
  });
  return merge(...observables);
}


  private mergeIntoBuffer(refId: string, incoming: DataFrame[]): DataFrame[] {
    if (!this.frameBuffer[refId]) {
      this.frameBuffer[refId] = new Map();
    }

    const buffer = this.frameBuffer[refId];

    incoming.forEach((frame, idx) => {
      const trimmed = this.trimFrame(frame);
      const key = this.getSeriesKey(trimmed, idx);

      const prev = buffer.get(key);

      if (!prev) {
        buffer.set(key, trimmed);
        return;
      }

      buffer.set(key, this.mergeFrames(prev, trimmed));
    });

    return Array.from(buffer.values());
  }


  private getSeriesKey(frame: DataFrame, index: number): string {
    return frame.name ?? `series-${index}`;
  }



  private mergeFrames(a: DataFrame, b: DataFrame): DataFrame {
    const timeA = a.fields.find(f => f.type === FieldType.time)!;
    const timeB = b.fields.find(f => f.type === FieldType.time)!;

    const timeValuesA = timeA.values.toArray() as number[];
    const timeValuesB = timeB.values.toArray() as number[];

    const allTimes = [...timeValuesA, ...timeValuesB];
    const uniqueTimes = Array.from(new Set(allTimes)).sort((x, y) => x - y);

    const resultFields = a.fields.map(fieldA => {
      const fieldB = b.fields.find(f => f.name === fieldA.name);

      // time field
      if (fieldA.type === FieldType.time) {
        return {
          name: fieldA.name,
          type: FieldType.time,
          values: uniqueTimes,
        };
      }

      const mapA = new Map<number, any>();
      const mapB = new Map<number, any>();

      const aTimes = timeValuesA;
      const bTimes = timeValuesB;

      const aVals = fieldA.values.toArray();
      const bVals = fieldB?.values.toArray() ?? [];

      for (let i = 0; i < aTimes.length; i++) {
        mapA.set(aTimes[i], aVals[i]);
      }

      for (let i = 0; i < bTimes.length; i++) {
        mapB.set(bTimes[i], bVals[i]);
      }

      const mergedValues = uniqueTimes.map(t => {
        if (mapB.has(t)) return mapB.get(t);
        if (mapA.has(t)) return mapA.get(t);
        return null;
      });

      return {
        name: fieldA.name,
        type: fieldA.type,
        values: mergedValues,
      };
    });

    // include any fields that exist only in b
    for (const fieldB of b.fields) {
      if (resultFields.find(f => f.name === fieldB.name)) continue;

      if (fieldB.type === FieldType.time) continue;

      // const bTimeField = b.fields.find(f => f.type === FieldType.time)!;
      // const bTimes = bTimeField.values.toArray() as number[];

      resultFields.push({
        name: fieldB.name,
        type: fieldB.type,
        values: fieldB.values.toArray(),
      });
    }

    return toDataFrame({
      name: a.name,
      fields: resultFields,
    });
  }



  private trimFrame(frame: DataFrame): DataFrame {
    const length = frame.length;

    if (length <= this.MAX_POINTS) {
      return frame;
    }

    const start = length - this.MAX_POINTS;

    return toDataFrame({
      name: frame.name,
      fields: frame.fields.map((f) => ({
        name: f.name,
        type: f.type,
        values: f.values.toArray().slice(start),
      })),
    });
  }



  async getContainers(): Promise<ContainerOption[]> {
    
    // if containers list is too large can cause rendering problems
    // on a later implemetation add pagination to prevent this
    const containers =
      await this.getResource<DockerContainer[]>(
        '/containers',
        {}
      );

    return containers.map((c) => ({
      label: c.Names?.[0] ?? c.Id,
      value: c.Id,
    }));
  }


  exportToAbstractQueries(
    queries: DockerQuery[]
  ): Promise<AbstractQuery[]> {
    return Promise.resolve([]);
  }
}
