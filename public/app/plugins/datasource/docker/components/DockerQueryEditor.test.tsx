import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DockerQueryEditor } from './DockerQueryEditor';

jest.mock('./ContainerSelect', () => ({
  ContainerSelect: ({ value, onChange }: any) => (
    <div>
      <button onClick={() => onChange('container-1')}>
        select-container
      </button>
      <span data-testid="selected">{value}</span>
    </div>
  ),
}));

jest.mock('@grafana/ui', () => ({
  Stack: ({ children }: any) => <div>{children}</div>,

  Select: ({ options, onChange }: any) => (
    <select
      data-testid="resource-select"
      onChange={(e) =>
        onChange(
          options.find((o: any) => o.value === e.target.value)
        )
      }
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),

  InlineField: ({ children }: any) => <div>{children}</div>,

  Switch: ({ value, onChange }: any) => (
    <input
      type="checkbox"
      data-testid="streaming-switch"
      checked={value}
      onChange={onChange}
    />
  ),
}));

const baseProps: any = {
  query: {
    resourceType: 'container_stats',
    containerId: 'abc',
    streaming: false,
  },
  datasource: {
    getContainers: jest.fn().mockResolvedValue([
      { label: 'c1', value: 'container-1' },
    ]),
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

    await user.selectOptions(
      screen.getByTestId('resource-select'),
      'system_df'
    );

    expect(baseProps.onChange).toHaveBeenCalled();
    expect(baseProps.onRunQuery).toHaveBeenCalled();
  });

  it('shows container select + switch for container_stats', () => {
    render(<DockerQueryEditor {...baseProps} />);

    expect(screen.getByText('select-container')).toBeInTheDocument();
    expect(screen.getByTestId('streaming-switch')).toBeInTheDocument();
  });

  it('hides container UI for other resource types', () => {
    render(
      <DockerQueryEditor
        {...baseProps}
        query={{ ...baseProps.query, resourceType: 'system_df' }}
      />
    );

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