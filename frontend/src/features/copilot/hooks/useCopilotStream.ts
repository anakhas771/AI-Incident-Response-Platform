import { useCallback, useRef } from 'react';
import { useCopilotStore } from '../state';

export interface UseCopilotStreamReturn {
  isStreaming: boolean;
  startStreaming: (prompt: string) => Promise<void>;
  stopStreaming: () => void;
  retryStreaming: () => Promise<void>;
  regenerateStreaming: () => Promise<void>;
}

/**
 * Hook for managing production SSE streaming state, abort controller, and retry/regenerate workflows.
 */
export function useCopilotStream(): UseCopilotStreamReturn {
  const isStreaming = useCopilotStore((s) => s.isStreaming);
  const sendPrompt = useCopilotStore((s) => s.sendPrompt);
  const stopGeneration = useCopilotStore((s) => s.stopGeneration);
  const retryResponse = useCopilotStore((s) => s.retryResponse);
  const regenerateResponse = useCopilotStore((s) => s.regenerateResponse);

  const activeStreamRef = useRef<boolean>(false);

  const startStreaming = useCallback(
    async (prompt: string) => {
      if (activeStreamRef.current) return;
      activeStreamRef.current = true;
      try {
        await sendPrompt(prompt);
      } finally {
        activeStreamRef.current = false;
      }
    },
    [sendPrompt]
  );

  const stopStreaming = useCallback(() => {
    stopGeneration();
    activeStreamRef.current = false;
  }, [stopGeneration]);

  const retryStreaming = useCallback(async () => {
    if (activeStreamRef.current) return;
    activeStreamRef.current = true;
    try {
      await retryResponse();
    } finally {
      activeStreamRef.current = false;
    }
  }, [retryResponse]);

  const regenerateStreaming = useCallback(async () => {
    if (activeStreamRef.current) return;
    activeStreamRef.current = true;
    try {
      await regenerateResponse();
    } finally {
      activeStreamRef.current = false;
    }
  }, [regenerateResponse]);

  return {
    isStreaming,
    startStreaming,
    stopStreaming,
    retryStreaming,
    regenerateStreaming,
  };
}
