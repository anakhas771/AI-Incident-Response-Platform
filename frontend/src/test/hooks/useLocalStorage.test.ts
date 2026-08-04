import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLocalStorage } from '../../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should return initial value when key does not exist', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default-val'));
    expect(result.current[0]).toBe('default-val');
  });

  it('should update localStorage when setter is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(window.localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should read existing JSON value from localStorage', () => {
    window.localStorage.setItem('existing-key', JSON.stringify({ name: 'SOC Admin' }));

    const { result } = renderHook(() => useLocalStorage('existing-key', { name: 'Default' }));

    expect(result.current[0]).toEqual({ name: 'SOC Admin' });
  });
});
