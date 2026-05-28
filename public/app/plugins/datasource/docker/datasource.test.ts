import { FieldType, toDataFrame } from '@grafana/data';
import DockerDatasource from './datasource';

function createDS() {
  return new DockerDatasource({
    url: 'http://localhost',
    name: 'docker',
    withCredentials: false,
    basicAuth: '',
    jsonData: {},
  } as any);
}

describe('DockerDatasource (safe tests)', () => {
  const ds = createDS();

  it('returns empty when no targets', (done) => {
    ds.query({ targets: [] } as any).subscribe((res) => {
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

    const result = (ds as any).mergeFrames(a, b);

    const timeField = result.fields.find((f: any) => f.name === 'time')!;
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

    const trimmed = (ds as any).trimFrame(frame);

    expect(trimmed.fields[0].values.length).toBe(500);
  });
});