import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Sion/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="bg-zinc-950 p-8">
        <Story />
      </div>
    ),
  ],
  args: {
    children: 'Upgrade to Pro',
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    variant: 'primary',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Processing…',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Upgrade to Pro',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Continue with Google',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Sign Out',
  },
};
