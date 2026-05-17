import { Alert } from '@grafana/ui';
import { DockerQuery } from '../types';

type Props = {
  query: DockerQuery;
  onChange: (query: DockerQuery) => void;
};

export const DockerQueryEditor = ({ query, onChange }: Props) => {
  return (
    <>
      <Alert title="TODO" severity="info">
        TODO implement query editor
      </Alert>
    </>
  );
};