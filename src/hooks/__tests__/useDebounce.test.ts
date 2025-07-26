import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Change the value
    rerender({ value: 'updated', delay: 500 })
    
    // Value should not change immediately
    expect(result.current).toBe('initial')

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500)
    })

    // Now value should be updated
    expect(result.current).toBe('updated')
  })

  it('cancels pending updates when value changes again', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    // First update
    rerender({ value: 'first update', delay: 500 })
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Value should still be initial
    expect(result.current).toBe('initial')

    // Second update before first completes
    rerender({ value: 'second update', delay: 500 })
    
    act(() => {
      vi.advanceTimersByTime(300)
    })
    
    // Value should still be initial (first update was cancelled)
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    // Now should have the second update
    expect(result.current).toBe('second update')
  })

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    )

    rerender({ value: 'updated', delay: 200 })
    
    act(() => {
      vi.advanceTimersByTime(200)
    })
    
    expect(result.current).toBe('updated')
  })

  it('works with different data types', () => {
    // Number
    const { result: numberResult } = renderHook(() => useDebounce(42, 500))
    expect(numberResult.current).toBe(42)

    // Object
    const obj = { name: 'test' }
    const { result: objectResult } = renderHook(() => useDebounce(obj, 500))
    expect(objectResult.current).toBe(obj)

    // Array
    const arr = [1, 2, 3]
    const { result: arrayResult } = renderHook(() => useDebounce(arr, 500))
    expect(arrayResult.current).toBe(arr)

    // Boolean
    const { result: boolResult } = renderHook(() => useDebounce(true, 500))
    expect(boolResult.current).toBe(true)
  })

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    
    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    rerender({ value: 'updated', delay: 500 })
    
    unmount()
    
    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  it('updates immediately when delay is 0', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    )

    rerender({ value: 'updated', delay: 0 })
    
    act(() => {
      vi.runAllTimers()
    })
    
    expect(result.current).toBe('updated')
  })
})