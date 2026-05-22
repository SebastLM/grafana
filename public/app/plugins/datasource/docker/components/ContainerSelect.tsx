import { useState } from 'react';

import { AsyncSelect, Button, Stack, Select } from '@grafana/ui';

import type { SelectableValue } from '@grafana/data';

export interface ContainerOption extends SelectableValue<string> {
  label: string;
  value: string;
}

interface Props {
  value?: string;

  onChange: (containerId: string) => void;

  loadOptions: (page: number, limit: number) => Promise<ContainerOption[]>;
}

const LIMIT_OPTIONS: Array<SelectableValue<number>> = [
  { label: '10 per page', value: 10 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
  { label: '100 per page', value: 100 },
];

export function ContainerSelect({
  value,
  onChange,
  loadOptions,
}: Props) {
  const [page, setPage] = useState(0);

  const [limit, setLimit] = useState(25);

  const [options, setOptions] = useState<ContainerOption[]>([]);

  const [loading, setLoading] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const loadPage = async (
    pageNumber: number,
    pageLimit: number
  ) => {
    setLoading(true);

    const rawOptions = await loadOptions(
      pageNumber,
      pageLimit
    );
    const newOptions: ContainerOption[] = rawOptions;

    if (pageNumber === 0) {
      setOptions(newOptions);
    } else {
      setOptions((prev) => [
        ...prev,
        ...newOptions,
      ]);
    }

    setHasMore(newOptions.length >= pageLimit);

    setLoading(false);
  };

  const loadMore = async () => {
    const nextPage = page + 1;

    setPage(nextPage);

    await loadPage(nextPage, limit);
  };

  const onLimitChange = async (
    v?: SelectableValue<number>
  ) => {
    const newLimit = v?.value ?? 25;

    setLimit(newLimit);

    setPage(0);

    await loadPage(0, newLimit);
  };

  return (
    <Stack direction="column" gap={1}>
      <Select
        value={LIMIT_OPTIONS.find(
          (o) => o.value === limit
        )}
        options={LIMIT_OPTIONS}
        onChange={onLimitChange}
        placeholder="Select page size"
      />

      <AsyncSelect
        allowCustomValue
        defaultOptions={options}
        value={
          value
            ? {
                label: value,
                value,
              }
            : null
        }
        loadOptions={async () => {
          if (options.length === 0) {
            await loadPage(0, limit);
          }

          return options;
        }}
        onChange={(v) =>
          onChange(v?.value ?? '')
        }
        placeholder="Select or type container ID"
      />

      <Button
        size="sm"
        variant="secondary"
        disabled={!hasMore || loading}
        onClick={loadMore}
      >
        {loading
          ? 'Loading...'
          : hasMore
            ? 'Load more'
            : 'No more'}
      </Button>
    </Stack>
  );
}