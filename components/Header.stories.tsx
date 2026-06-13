import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';
import { LanguageProvider } from '../app/context/Languagecontext';

const meta: Meta<typeof Header> = {
  title: 'Sion/Header',
  component: Header,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LanguageProvider>
        <div className="w-full bg-zinc-950 p-4">
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {};