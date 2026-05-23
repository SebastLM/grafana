import { Stack, Select } from '@grafana/ui';
import type { QueryEditorProps } from '@grafana/data';

import type DockerDatasource from '../datasource';
import type { DockerOptions, DockerQuery } from '../types';

import { ContainerSelect } from './ContainerSelect';

type Props = QueryEditorProps<DockerDatasource, DockerQuery, DockerOptions>;

const RESOURCE_TYPES = [
  { label: 'Container Stats', value: 'container_stats' },
  { label: 'System DF', value: 'system_df' },
  { label: 'All Containers Info', value: 'all_containers_info' },
];

export function DockerQueryEditor({
  query,
  onChange,
  onRunQuery,
  datasource,
}: Props) {
  const update = (patch: Partial<DockerQuery>) => {
    onChange({ ...query, ...patch });

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
        <ContainerSelect
          value={query.containerId}
          onChange={(containerId: string) =>
            update({
              containerId,
            })
          }
          loadOptions={(page, limit) =>
            datasource.getContainers(page, limit)
          }
        />
      )}
    </Stack>
  );
}