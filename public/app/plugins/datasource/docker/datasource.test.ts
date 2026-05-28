import { FieldType, toDataFrame, type DataQueryRequest, type DataQuery } from '@grafana/data';

import DockerDatasource from './datasource';
import type { DockerOptions } from './types';

interface DataSourceConstructorArgs {
  url: string;
  name: string;
  withCredentials: boolean;
  basicAuth: string;
  jsonData: Partial<DockerOptions>;
}

function createDS(): DockerDatasource {
  const args: DataSourceConstructorArgs = {
    url: 'http://localhost',
    name: 'docker',
    withCredentials: false,
    basicAuth: '',
    jsonData: {},
  };
  return new DockerDatasource(args);
}

describe('DockerDatasource (safe tests)', () => {
  const ds = createDS();

  it('returns empty when no targets', (done) => {
    const emptyRequest: DataQueryRequest<DataQuery> = {
      targets: [],
      requestId: 'test',
      interval: '',
      intervalMs: 0,
      range: {
        from: { toDate: () => new Date(), toUnix: () => 0, valueOf: () => 0 },
        to: { toDate: () => new Date(), toUnix: () => 0, valueOf: () => 0 },
      },
      scopedVars: {},
      startTime: 0,
    } as DataQueryRequest<DataQuery>;

    ds.query(emptyRequest).subscribe((res) => {
      expect(res.data).toEqual([]);
      done();
    });
  });

  it('mergeFrames merges times correctly', () => {
    const a = toDataFrame({
      name: 'cpu',
      fields: [
        { name: 'time', type: FieldType.time, values: [1000, 2000] },
        { name: 'value', type: FieldType.number, values: [10, 20] },
      ],
    });

    const b = toDataFrame({
      name: 'cpu',
      fields: [
        { name: 'time', type: FieldType.time, values: [2000, 3000] },
        { name: 'value', type: FieldType.number, values: [30, 40] },
      ],
    });

    const result = (ds as DockerDatasource & { mergeFrames: Function }).mergeFrames(a, b);

    const timeField = result.fields.find((f: { name: string }) => f.name === 'time')!;
    expect(timeField.values).toContain(1000);
    expect(timeField.values).toContain(3000);
  });

  it('trimFrame limits to MAX_POINTS', () => {
    const frame = toDataFrame({
      name: 'cpu',
      fields: [
        {
          name: 'time',
          type: FieldType.time,
          values: Array.from({ length: 600 }, (_, i) => i),
        },
        {
          name: 'value',
          type: FieldType.number,
          values: Array.from({ length: 600 }, (_, i) => i),
        },
      ],
    });

    const trimmed = (ds as DockerDatasource & { trimFrame: Function }).trimFrame(frame);

    expect(trimmed.fields[0].values.length).toBe(500);
  });
});
