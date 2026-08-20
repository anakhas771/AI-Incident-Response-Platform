import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CopilotComposer } from '../components/CopilotComposer';

describe('CopilotComposer', () => {
  it('calls onSendPrompt when Enter is pressed without Shift', () => {
    const onSendPrompt = vi.fn();
    render(
      <CopilotComposer
        isStreaming={false}
        currentModel="gpt-4o"
        onSendPrompt={onSendPrompt}
        onStopGeneration={vi.fn()}
      />
    );

    const textarea = screen.getByLabelText('Enterprise Copilot Prompt Input');
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSendPrompt).toHaveBeenCalledWith('Test prompt');
  });

  it('calls onStopGeneration when Escape is pressed while streaming', () => {
    const onStopGeneration = vi.fn();
    render(
      <CopilotComposer
        isStreaming={true}
        currentModel="gpt-4o"
        onSendPrompt={vi.fn()}
        onStopGeneration={onStopGeneration}
      />
    );

    const textarea = screen.getByLabelText('Enterprise Copilot Prompt Input');
    fireEvent.keyDown(textarea, { key: 'Escape' });

    expect(onStopGeneration).toHaveBeenCalledTimes(1);
  });
});
