import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopilotStream } from '../hooks/useCopilotStream';
import { useCopilotStore } from '../state/useCopilotStore';

describe('useCopilotStream', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCopilotStore.getState().reset();
  });

  it('should reflect initial non-streaming state', () => {
    const { result } = renderHook(() => useCopilotStream());
    expect(result.current.isStreaming).toBe(false);
  });

  it('should call stopGeneration when stopStreaming is invoked', () => {
    const stopSpy = vi.spyOn(useCopilotStore.getState(), 'stopGeneration');
    const { result } = renderHook(() => useCopilotStream());

    act(() => {
      result.current.stopStreaming();
    });

    expect(stopSpy).toHaveBeenCalled();
  });
});
