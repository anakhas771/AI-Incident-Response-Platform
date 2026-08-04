import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSSEBlock, streamCopilotChat } from '../../api/copilotApi';
import { useAuthStore } from '../../stores/useAuthStore';

describe('copilotApi - SSE block parser', () => {
  it('should parse simple start block correctly', () => {
    const block = `id: 1\nevent: start\ndata: {"session_id":"s-1","status":"started"}`;
    const result = parseSSEBlock(block);
    expect(result).not.toBeNull();
    expect(result?.eventType).toBe('start');
    expect(result?.data).toEqual({ session_id: 's-1', status: 'started' });
  });

  it('should parse token event with text string', () => {
    const block = `event: token\ndata: "Hello world"`;
    const result = parseSSEBlock(block);
    expect(result?.eventType).toBe('token');
    expect(result?.data).toBe('Hello world');
  });

  it('should parse citation event with array', () => {
    const citationsJson = JSON.stringify([
      {
        document_id: 'doc-1',
        document_title: 'Architecture Spec',
        page: 4,
        chunk_index: 0,
        similarity: 0.94,
        snippet: 'Connection timeout defaults to 2500ms.',
      },
    ]);
    const block = `event: citation\ndata: ${citationsJson}`;
    const result = parseSSEBlock(block);
    expect(result?.eventType).toBe('citation');
    expect(Array.isArray(result?.data)).toBe(true);
    expect((result?.data as unknown[])[0]).toHaveProperty('document_title', 'Architecture Spec');
  });

  it('should treat heartbeat lines as keep-alive', () => {
    const block = `: heartbeat`;
    const result = parseSSEBlock(block);
    expect(result?.eventType).toBe('heartbeat');
    expect(result?.data).toBe('keep-alive');
  });

  it('should parse error event correctly', () => {
    const block = `event: error\ndata: {"error":"Rate limit exceeded","code":"RATE_LIMIT"}`;
    const result = parseSSEBlock(block);
    expect(result?.eventType).toBe('error');
    expect(result?.data).toEqual({ error: 'Rate limit exceeded', code: 'RATE_LIMIT' });
  });
});

describe('copilotApi - streamCopilotChat client', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'mock-test-token' });
  });

  it('should invoke callbacks when reading a simulated stream', async () => {
    const onStart = vi.fn();
    const onToken = vi.fn();
    const onDone = vi.fn();

    const streamData =
      `event: start\ndata: {"session_id":"test-1","status":"started"}\n\n` +
      `event: token\ndata: "Hello "\n\n` +
      `event: token\ndata: "World!"\n\n` +
      `event: done\ndata: {"session_id":"test-1","status":"completed"}\n\n`;

    const mockReader = {
      read: vi
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: new TextEncoder().encode(streamData),
        })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    } as unknown as Response);

    await streamCopilotChat('test-1', 'Hi', { onStart, onToken, onDone });

    expect(onStart).toHaveBeenCalledWith({ session_id: 'test-1', status: 'started' });
    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenNthCalledWith(1, 'Hello ');
    expect(onToken).toHaveBeenNthCalledWith(2, 'World!');
    expect(onDone).toHaveBeenCalledWith({ session_id: 'test-1', status: 'completed' });
  });

  it('should handle fetch errors and call onError', async () => {
    const onError = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ error: 'Database timeout' }),
    } as unknown as Response);

    await streamCopilotChat('test-1', 'Hi', { onError }, undefined, 0);

    expect(onError).toHaveBeenCalledWith({
      error: 'Stream disconnected: Database timeout',
      code: 'STREAM_MAX_RETRIES_EXCEEDED',
    });
  });
});
