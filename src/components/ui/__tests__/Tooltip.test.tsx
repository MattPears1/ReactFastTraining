import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows tooltip on hover', async () => {
    render(
      <Tooltip content="Helpful information">
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    
    // Tooltip should not be visible initially
    expect(screen.queryByText('Helpful information')).not.toBeInTheDocument();
    
    // Hover over the trigger
    fireEvent.mouseEnter(trigger);
    
    // Fast-forward timers
    vi.runAllTimers();
    
    // Tooltip should be visible
    await waitFor(() => {
      expect(screen.getByText('Helpful information')).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave', async () => {
    render(
      <Tooltip content="Helpful information">
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    
    // Show tooltip
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Helpful information')).toBeInTheDocument();
    });
    
    // Hide tooltip
    fireEvent.mouseLeave(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      expect(screen.queryByText('Helpful information')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus when trigger is click', async () => {
    render(
      <Tooltip content="Click information" trigger="click">
        <button>Click me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Click me');
    
    // Click the trigger
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Click information')).toBeInTheDocument();
    });
    
    // Click again to hide
    fireEvent.click(trigger);
    
    await waitFor(() => {
      expect(screen.queryByText('Click information')).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus for keyboard navigation', async () => {
    const user = userEvent.setup({ delay: null });
    
    render(
      <Tooltip content="Focus information" trigger="focus">
        <button>Focus me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Focus me');
    
    // Tab to focus
    await user.tab();
    expect(trigger).toHaveFocus();
    
    await waitFor(() => {
      expect(screen.getByText('Focus information')).toBeInTheDocument();
    });
    
    // Tab away to blur
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText('Focus information')).not.toBeInTheDocument();
    });
  });

  it('respects delay prop', async () => {
    render(
      <Tooltip content="Delayed tooltip" delay={500}>
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    
    fireEvent.mouseEnter(trigger);
    
    // Should not show immediately
    expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument();
    
    // Advance time by less than delay
    vi.advanceTimersByTime(300);
    expect(screen.queryByText('Delayed tooltip')).not.toBeInTheDocument();
    
    // Advance time past delay
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('Delayed tooltip')).toBeInTheDocument();
    });
  });

  it('positions tooltip correctly', async () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];
    
    for (const position of positions) {
      const { unmount } = render(
        <Tooltip content={`${position} tooltip`} position={position}>
          <button>Trigger</button>
        </Tooltip>
      );
      
      const trigger = screen.getByText('Trigger');
      fireEvent.mouseEnter(trigger);
      vi.runAllTimers();
      
      await waitFor(() => {
        const tooltip = screen.getByText(`${position} tooltip`);
        expect(tooltip.parentElement).toHaveAttribute('data-position', position);
      });
      
      unmount();
    }
  });

  it('handles disabled state', () => {
    render(
      <Tooltip content="Disabled tooltip" disabled>
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    // Tooltip should not show when disabled
    expect(screen.queryByText('Disabled tooltip')).not.toBeInTheDocument();
  });

  it('supports custom className', async () => {
    render(
      <Tooltip content="Custom tooltip" className="custom-tooltip">
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      const tooltip = screen.getByText('Custom tooltip').parentElement;
      expect(tooltip).toHaveClass('custom-tooltip');
    });
  });

  it('handles arrow prop', async () => {
    render(
      <Tooltip content="Arrow tooltip" arrow>
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      const arrow = screen.getByTestId('tooltip-arrow');
      expect(arrow).toBeInTheDocument();
    });
  });

  it('supports multiline content', async () => {
    render(
      <Tooltip
        content={
          <>
            <div>Line 1</div>
            <div>Line 2</div>
          </>
        }
      >
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Line 1')).toBeInTheDocument();
      expect(screen.getByText('Line 2')).toBeInTheDocument();
    });
  });

  it('handles interactive content', async () => {
    render(
      <Tooltip
        content={
          <div>
            <p>Interactive tooltip</p>
            <button>Click me</button>
          </div>
        }
        interactive
      >
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      const tooltipButton = screen.getByText('Click me');
      expect(tooltipButton).toBeInTheDocument();
    });
    
    // Move mouse to tooltip content
    const tooltipContent = screen.getByText('Interactive tooltip');
    fireEvent.mouseEnter(tooltipContent);
    
    // Tooltip should remain visible
    expect(screen.getByText('Interactive tooltip')).toBeInTheDocument();
  });

  it('handles max width constraint', async () => {
    render(
      <Tooltip content="This is a very long tooltip content that should wrap" maxWidth={200}>
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      const tooltip = screen.getByText(/This is a very long tooltip/).parentElement;
      expect(tooltip).toHaveStyle({ maxWidth: '200px' });
    });
  });

  it('prevents tooltip from going off-screen', async () => {
    // Mock getBoundingClientRect to simulate near edge
    const mockGetBoundingClientRect = vi.fn(() => ({
      top: 10,
      left: window.innerWidth - 50,
      bottom: 50,
      right: window.innerWidth - 10,
      width: 40,
      height: 40,
      x: window.innerWidth - 50,
      y: 10,
      toJSON: () => {},
    }));
    
    render(
      <Tooltip content="Edge tooltip" position="right">
        <button ref={el => el && (el.getBoundingClientRect = mockGetBoundingClientRect)}>
          Near edge
        </button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Near edge');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      const tooltip = screen.getByText('Edge tooltip').parentElement;
      // Should flip to left position
      expect(tooltip).toHaveAttribute('data-position', 'left');
    });
  });

  it('cleans up on unmount', async () => {
    const { unmount } = render(
      <Tooltip content="Cleanup test">
        <button>Hover me</button>
      </Tooltip>
    );
    
    const trigger = screen.getByText('Hover me');
    fireEvent.mouseEnter(trigger);
    vi.runAllTimers();
    
    await waitFor(() => {
      expect(screen.getByText('Cleanup test')).toBeInTheDocument();
    });
    
    unmount();
    
    expect(screen.queryByText('Cleanup test')).not.toBeInTheDocument();
  });
});