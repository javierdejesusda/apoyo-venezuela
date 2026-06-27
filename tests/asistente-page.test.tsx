// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UIMessage } from 'ai';

const mockSendMessage = vi.fn();
const mockStop = vi.fn();

let mockStatus: string = 'ready';
let mockError: Error | undefined = undefined;
let mockMessages: UIMessage[] = [];

vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage: mockSendMessage,
    stop: mockStop,
    status: mockStatus,
    error: mockError,
    setMessages: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('ai', async (importOriginal) => {
  const mod = await importOriginal<typeof import('ai')>();
  return { ...mod, DefaultChatTransport: vi.fn() };
});

const { default: AsistentePage } = await import('@/app/asistente/page');

describe('AsistentePage', () => {
  beforeEach(() => {
    mockStatus = 'ready';
    mockError = undefined;
    mockMessages = [];
    mockSendMessage.mockClear();
    mockStop.mockClear();
  });

  it('renders an aria-live region for streaming output', () => {
    render(<AsistentePage />);

    expect(document.querySelector('[aria-live]')).toBeTruthy();
  });

  it('renders example-question chips with Spanish text', () => {
    render(<AsistentePage />);

    const chips = screen.getAllByRole('button', { name: /agua|medicinas|alimentos|ayuda/i });

    expect(chips.length).toBeGreaterThanOrEqual(3);
  });

  it('renders an empty-state prompt when there are no messages', () => {
    render(<AsistentePage />);

    expect(screen.getByText(/pregunta/i)).toBeTruthy();
  });

  it('calls sendMessage when a chip is clicked', () => {
    render(<AsistentePage />);

    const chips = screen.getAllByRole('button', { name: /agua|medicinas|alimentos|ayuda/i });
    fireEvent.click(chips[0]);

    expect(mockSendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.any(String) }),
    );
  });

  it('shows a Stop button while streaming', () => {
    mockStatus = 'streaming';

    render(<AsistentePage />);

    expect(screen.getByRole('button', { name: /detener|stop|cancelar/i })).toBeTruthy();
  });

  it('shows a Spanish error banner on error', () => {
    mockError = new Error('Algo salio mal');

    render(<AsistentePage />);

    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
