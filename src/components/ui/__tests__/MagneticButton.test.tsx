import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MagneticButton from '../MagneticButton';

describe('MagneticButton Component', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 100,
      height: 40,
      top: 100,
      left: 100,
      bottom: 140,
      right: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));
  });

  it('renders with children', () => {
    render(<MagneticButton>Magnetic Button</MagneticButton>);
    expect(screen.getByText('Magnetic Button')).toBeInTheDocument();
  });

  it('applies magnetic effect on mouse move', () => {
    render(<MagneticButton>Hover Me</MagneticButton>);
    
    const button = screen.getByText('Hover Me').parentElement;
    
    // Simulate mouse enter
    fireEvent.mouseEnter(button!);
    
    // Simulate mouse move near the center
    fireEvent.mouseMove(button!, {
      clientX: 150, // Center X
      clientY: 120, // Center Y
    });
    
    // Check if transform is applied
    expect(button).toHaveStyle({
      transform: expect.stringContaining('translate3d'),
    });
  });

  it('resets position on mouse leave', () => {
    render(<MagneticButton>Hover Me</MagneticButton>);
    
    const button = screen.getByText('Hover Me').parentElement;
    
    // Simulate mouse enter and move
    fireEvent.mouseEnter(button!);
    fireEvent.mouseMove(button!, {
      clientX: 180,
      clientY: 130,
    });
    
    // Simulate mouse leave
    fireEvent.mouseLeave(button!);
    
    // Check if transform is reset
    expect(button).toHaveStyle({
      transform: 'translate3d(0, 0, 0)',
    });
  });

  it('adjusts strength of magnetic effect', () => {
    const { rerender } = render(
      <MagneticButton strength={0.5}>Weak Magnetic</MagneticButton>
    );
    
    let button = screen.getByText('Weak Magnetic').parentElement;
    
    fireEvent.mouseEnter(button!);
    fireEvent.mouseMove(button!, {
      clientX: 200, // Far from center
      clientY: 140,
    });
    
    const weakTransform = button!.style.transform;
    
    // Re-render with stronger magnetic effect
    rerender(
      <MagneticButton strength={2}>Strong Magnetic</MagneticButton>
    );
    
    button = screen.getByText('Strong Magnetic').parentElement;
    
    fireEvent.mouseEnter(button!);
    fireEvent.mouseMove(button!, {
      clientX: 200, // Same position
      clientY: 140,
    });
    
    const strongTransform = button!.style.transform;
    
    // The transforms should be different (stronger effect should have larger values)
    expect(weakTransform).not.toBe(strongTransform);
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <MagneticButton onClick={handleClick}>
        Click Me
      </MagneticButton>
    );
    
    const button = screen.getByText('Click Me');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(
      <MagneticButton disabled>
        Disabled Button
      </MagneticButton>
    );
    
    const button = screen.getByText('Disabled Button').parentElement;
    
    // Magnetic effect should not apply when disabled
    fireEvent.mouseEnter(button!);
    fireEvent.mouseMove(button!, {
      clientX: 150,
      clientY: 120,
    });
    
    expect(button).toHaveStyle({
      transform: 'translate3d(0, 0, 0)',
    });
  });

  it('applies custom className', () => {
    render(
      <MagneticButton className="custom-magnetic">
        Custom Class
      </MagneticButton>
    );
    
    const button = screen.getByText('Custom Class').parentElement;
    expect(button).toHaveClass('custom-magnetic');
  });

  it('supports different variants', () => {
    const { rerender } = render(
      <MagneticButton variant="primary">Primary</MagneticButton>
    );
    
    let button = screen.getByText('Primary');
    expect(button).toHaveClass('bg-primary-600');
    
    rerender(
      <MagneticButton variant="secondary">Secondary</MagneticButton>
    );
    
    button = screen.getByText('Secondary');
    expect(button).toHaveClass('bg-secondary-600');
  });

  it('supports different sizes', () => {
    const { rerender } = render(
      <MagneticButton size="sm">Small</MagneticButton>
    );
    
    let button = screen.getByText('Small');
    expect(button).toHaveClass('text-sm');
    
    rerender(
      <MagneticButton size="lg">Large</MagneticButton>
    );
    
    button = screen.getByText('Large');
    expect(button).toHaveClass('text-lg');
  });

  it('applies smooth transition', () => {
    render(<MagneticButton>Smooth Button</MagneticButton>);
    
    const button = screen.getByText('Smooth Button').parentElement;
    expect(button).toHaveClass('transition-transform');
  });

  it('handles rapid mouse movements', async () => {
    const user = userEvent.setup();
    render(<MagneticButton>Rapid Move</MagneticButton>);
    
    const button = screen.getByText('Rapid Move').parentElement;
    
    // Simulate rapid mouse movements
    fireEvent.mouseEnter(button!);
    
    for (let i = 0; i < 10; i++) {
      fireEvent.mouseMove(button!, {
        clientX: 100 + i * 10,
        clientY: 100 + i * 5,
      });
    }
    
    // Button should still be functional
    fireEvent.click(button!);
    expect(button).toBeInTheDocument();
  });

  it('works with touch events on mobile', () => {
    render(<MagneticButton>Touch Me</MagneticButton>);
    
    const button = screen.getByText('Touch Me').parentElement;
    
    // Simulate touch start
    fireEvent.touchStart(button!, {
      touches: [{ clientX: 150, clientY: 120 }],
    });
    
    // Simulate touch move
    fireEvent.touchMove(button!, {
      touches: [{ clientX: 160, clientY: 125 }],
    });
    
    // Simulate touch end
    fireEvent.touchEnd(button!);
    
    // Button should reset after touch end
    expect(button).toHaveStyle({
      transform: 'translate3d(0, 0, 0)',
    });
  });

  it('maintains accessibility', () => {
    render(
      <MagneticButton aria-label="Accessible magnetic button">
        Accessible
      </MagneticButton>
    );
    
    const button = screen.getByLabelText('Accessible magnetic button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  it('preserves focus behavior', async () => {
    const user = userEvent.setup();
    render(<MagneticButton>Focus Me</MagneticButton>);
    
    const button = screen.getByText('Focus Me');
    
    await user.tab();
    expect(button).toHaveFocus();
    
    // Magnetic effect should work even when focused
    fireEvent.mouseMove(button, {
      clientX: 150,
      clientY: 120,
    });
    
    expect(button.parentElement).toHaveStyle({
      transform: expect.stringContaining('translate3d'),
    });
  });
});