import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal Component', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'modal-root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('renders when open', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        Modal Content
      </Modal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when clicking close button', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking overlay', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when clicking modal content', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal">
        <div data-testid="modal-content">Content</div>
      </Modal>
    );
    
    const content = screen.getByTestId('modal-content');
    fireEvent.click(content);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape key', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal">
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal" closeOnEscape={false}>
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen onClose={handleClose} title="Test Modal" closeOnOverlayClick={false}>
        Content
      </Modal>
    );
    
    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()} size="sm">
        Small Modal
      </Modal>
    );
    
    let modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen onClose={vi.fn()} size="lg">
        Large Modal
      </Modal>
    );
    
    modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('max-w-4xl');

    rerender(
      <Modal isOpen onClose={vi.fn()} size="full">
        Full Modal
      </Modal>
    );
    
    modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('max-w-full');
  });

  it('renders footer actions', () => {
    render(
      <Modal
        isOpen
        onClose={vi.fn()}
        title="Modal with Footer"
        footer={
          <>
            <button>Cancel</button>
            <button>Confirm</button>
          </>
        }
      >
        Content
      </Modal>
    );
    
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('handles focus trap', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={vi.fn()} title="Focus Trap Modal">
        <input data-testid="input-1" />
        <button data-testid="button-1">Button 1</button>
        <button data-testid="button-2">Button 2</button>
      </Modal>
    );
    
    const input = screen.getByTestId('input-1');
    const button1 = screen.getByTestId('button-1');
    const button2 = screen.getByTestId('button-2');
    
    // Focus should be on the first focusable element
    input.focus();
    expect(document.activeElement).toBe(input);
    
    // Tab through elements
    await user.tab();
    expect(document.activeElement).toBe(button1);
    
    await user.tab();
    expect(document.activeElement).toBe(button2);
  });

  it('prevents body scroll when open', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        Content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()}>
        Content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Modal isOpen={false} onClose={vi.fn()}>
        Content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('renders with custom className', () => {
    render(
      <Modal isOpen onClose={vi.fn()} className="custom-modal">
        Content
      </Modal>
    );
    
    const modalContent = screen.getByTestId('modal-content');
    expect(modalContent).toHaveClass('custom-modal');
  });

  it('shows loading state', () => {
    render(
      <Modal isOpen onClose={vi.fn()} loading>
        Content
      </Modal>
    );
    
    expect(screen.getByTestId('modal-loading')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });
});