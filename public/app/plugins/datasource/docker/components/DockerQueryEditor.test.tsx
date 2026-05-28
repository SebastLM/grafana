import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DockerQueryEditor } from './DockerQueryEditor';

interface ContainerSelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
}

interface StackProps {
  children: React.ReactNode;
}

interface SelectProps {
  options: Array<{ label: string; value: string }>;
  onChange: (option: { label: string; value: string }) => void;
}

interface InlineFieldProps {
  children: React.ReactNode;
}

interface SwitchProps {
  value: boolean;
  onChange: () => void;
}

interface DockerQueryEditorProps {
  query: {
    resourceType: string;
    containerId: string;
    streaming: boolean;
  };
  datasource: {
    getContainers: () => Promise<Array<{ label: string; value: string }>>;
  };
  onChange: jest.Mock;
  onRunQuery: jest.Mock;
}

jest.mock('./ContainerSelect', () => ({
  ContainerSelect: ({ value, onChange }: ContainerSelectProps) => (
    <div>
      <button onClick={() => onChange('container-1')}>select-container</button>
      <span data-testid="selected">{value}</span>
    </div>
  ),
}));

jest.mock('@grafana/ui', () => ({
  Stack: ({ children }: StackProps) => <div>{children}</div>,

  Select: ({ options, onChange }: SelectProps) => (
    <select
      data-testid="resource-select"
      onChange={(e) => {
        const selectedOption = options.find((o: { label: string; value: string }) => o.value === e.target.value);
        if (selectedOption) {
          onChange(selectedOption);
        }
      }}
    >
      {options.map((o: { label: string; value: string }) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),

  InlineField: ({ children }: InlineFieldProps) => <div>{children}</div>,

  Switch: ({ value, onChange }: SwitchProps) => (
    <input type="checkbox" data-testid="streaming-switch" checked={value} onChange={onChange} />
  ),
}));

const baseProps: DockerQueryEditorProps = {
  query: {
    resourceType: 'container_stats',
    containerId: 'abc',
    streaming: false,
  },
  datasource: {
    getContainers: jest.fn().mockResolvedValue([{ label: 'c1', value: 'container-1' }]),
  },
  onChange: jest.fn(),
  onRunQuery: jest.fn(),
};

describe('DockerQueryEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders resource selector', () => {
    render(<DockerQueryEditor {...baseProps} />);

    expect(screen.getByTestId('resource-select')).toBeInTheDocument();
  });

  it('changes resource type and triggers callbacks', async () => {
    const user = userEvent.setup();

    render(<DockerQueryEditor {...baseProps} />);

    await user.selectOptions(screen.getByTestId('resource-select'), 'system_df');

    expect(baseProps.onChange).toHaveBeenCalled();
    expect(baseProps.onRunQuery).toHaveBeenCalled();
  });

  it('shows container select + switch for container_stats', () => {
    render(<DockerQueryEditor {...baseProps} />);

    expect(screen.getByText('select-container')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-switch')).toBeInTheDocument();
  });

  it('hides container UI for other resource types', () => {
    render(<DockerQueryEditor {...baseProps} query={{ ...baseProps.query, resourceType: 'system_df' }} />);

    expect(screen.queryByText('select-container')).not.toBeInTheDocument();
  });

  it('toggles streaming switch', async () => {
    const user = userEvent.setup();

    render(<DockerQueryEditor {...baseProps} />);

    await user.click(screen.getByTestId('streaming-switch'));

    expect(baseProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        streaming: true,
      })
    );

    expect(baseProps.onRunQuery).toHaveBeenCalled();
  });
});
