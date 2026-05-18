import { Stack, Select, Input } from '@grafana/ui';
import type { QueryEditorProps } from '@grafana/data';

import type DockerDatasource from '../datasource';
import type { DockerOptions, DockerQuery } from '../types';

type Props = QueryEditorProps<DockerDatasource, DockerQuery, DockerOptions>;

const RESOURCE_TYPES = [
  { label: 'Container Stats', value: 'container_stats' },
  { label: 'System DF', value: 'system_df' },
];

export function DockerQueryEditor({ query, onChange, onRunQuery }: Props) {
  const update = (patch: Partial<DockerQuery>) => {
    const newQuery = { ...query, ...patch };
    onChange(newQuery);
    onRunQuery();
  };

  return (
    <Stack direction="column" gap={1}>
      <Select
        value={RESOURCE_TYPES.find((r) => r.value === query.resourceType)}
        options={RESOURCE_TYPES}
        onChange={(v) =>
          update({
            resourceType: v?.value as DockerQuery['resourceType'],
          })
        }
      />

      {query.resourceType === 'container_stats' && (
        <Stack direction="column" gap={1}>

          {/* TODO later only use the select with backend provided list of available containers */}
          <Select
            value={
              query.containerId
                ? { label: query.containerId, value: query.containerId }
                : null
            }
            options={[]}
            onChange={(v) =>
              update({
                containerId: v?.value ?? '',
              })
            }
            placeholder="Select container (optional)"
            isClearable
          />

          {/* Temporary way of selecting containers manually */}
          <Input
            value={query.containerId ?? ''}
            placeholder="Or type container ID manually"
            onChange={(e) =>
              update({
                containerId: e.currentTarget.value,
              })
            }
          />
        </Stack>
      )}
    </Stack>
  );
}