import { useEffect, useState } from 'react';

import {
  AsyncSelect,
  Button,
  InlineFieldRow,
  Select,
  Stack,
} from '@grafana/ui';

import type { SelectableValue } from '@grafana/data';

export interface ContainerOption
  extends SelectableValue<string> {
  label: string;
  value: string;
}

interface Props {
  value?: string;

  onChange: (
    containerId: string
  ) => void;

  loadOptions: (
    page: number,
    limit: number
  ) => Promise<ContainerOption[]>;
}

const LIMIT_OPTIONS: Array<
  SelectableValue<number>
> = [
  { label: '10 / page', value: 10 },
  { label: '25 / page', value: 25 },
  { label: '50 / page', value: 50 },
  { label: '100 / page', value: 100 },
];

export function ContainerSelect({
  value,
  onChange,
  loadOptions,
}: Props) {
  const [page, setPage] = useState(0);

  const [limit, setLimit] =
    useState(25);

  const [options, setOptions] =
    useState<ContainerOption[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [hasNext, setHasNext] =
    useState(true);

  const loadPage = async (
    pageNumber: number,
    pageLimit: number
  ) => {
    setLoading(true);

    try {
      const result =
        await loadOptions(
          pageNumber,
          pageLimit
        );

      setOptions(result);

      setHasNext(
        result.length >= pageLimit
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(page, limit);
  }, [page, limit]);

  const nextPage = async () => {
    if (!hasNext || loading) {
      return;
    }

    setPage((p) => p + 1);
  };

  const prevPage = async () => {
    if (page === 0 || loading) {
      return;
    }

    setPage((p) => p - 1);
  };

  const onLimitChange = (
    v?: SelectableValue<number>
  ) => {
    setPage(0);

    setLimit(v?.value ?? 25);
  };

  return (
    <Stack
      direction="column"
      gap={1}
    >
      <AsyncSelect
        allowCustomValue
        isLoading={loading}
        defaultOptions={options}
        value={
          value
            ? {
                label: value,
                value,
              }
            : null
        }
        loadOptions={async () =>
          options
        }
        onChange={(v) =>
          onChange(v?.value ?? '')
        }
        placeholder="Select container"
      />

      <InlineFieldRow>
        <Button
          size="sm"
          variant="secondary"
          onClick={prevPage}
          disabled={
            page === 0 || loading
          }
        >
          Previous
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={nextPage}
          disabled={
            !hasNext || loading
          }
        >
          Next
        </Button>

        <div
          style={{
            padding:
              '0 8px',
            display: 'flex',
            alignItems:
              'center',
            fontSize: '12px',
            opacity: 0.8,
          }}
        >
          Page {page + 1}
        </div>

        <div
          style={{
            minWidth: 140,
          }}
        >
          <Select
            options={
              LIMIT_OPTIONS
            }
            value={LIMIT_OPTIONS.find(
              (o) =>
                o.value ===
                limit
            )}
            onChange={
              onLimitChange
            }
          />
        </div>
      </InlineFieldRow>
    </Stack>
  );
}