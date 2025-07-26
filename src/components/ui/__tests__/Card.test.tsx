import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Card title="Card Title">Content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title').tagName).toBe('H3');
  });

  it('renders with subtitle', () => {
    render(<Card title="Title" subtitle="Subtitle">Content</Card>);
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toHaveClass('text-gray-600');
  });

  it('renders with image', () => {
    render(
      <Card
        image="/test-image.jpg"
        imageAlt="Test Image"
        title="Card with Image"
      >
        Content
      </Card>
    );
    const image = screen.getByAltText('Test Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('applies hover effect when hoverable', () => {
    render(<Card hoverable>Hoverable Card</Card>);
    const card = screen.getByText('Hoverable Card').parentElement;
    expect(card).toHaveClass('hover:shadow-lg');
  });

  it('handles click events when clickable', () => {
    const handleClick = vi.fn();
    render(
      <Card clickable onClick={handleClick}>
        Clickable Card
      </Card>
    );
    
    const card = screen.getByText('Clickable Card').parentElement;
    fireEvent.click(card);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(card).toHaveClass('cursor-pointer');
  });

  it('renders with custom className', () => {
    render(<Card className="custom-class">Card</Card>);
    const card = screen.getByText('Card').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('renders footer content', () => {
    render(
      <Card footer={<div>Footer Content</div>}>
        Main Content
      </Card>
    );
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('renders header actions', () => {
    render(
      <Card
        title="Card"
        headerActions={<button>Action</button>}
      >
        Content
      </Card>
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies padding based on noPadding prop', () => {
    const { rerender } = render(<Card>With Padding</Card>);
    let card = screen.getByText('With Padding').parentElement;
    expect(card).toHaveClass('p-6');

    rerender(<Card noPadding>No Padding</Card>);
    card = screen.getByText('No Padding').parentElement;
    expect(card).not.toHaveClass('p-6');
  });

  it('applies shadow based on variant', () => {
    const { rerender } = render(<Card variant="flat">Flat Card</Card>);
    let card = screen.getByText('Flat Card').parentElement;
    expect(card).not.toHaveClass('shadow');

    rerender(<Card variant="elevated">Elevated Card</Card>);
    card = screen.getByText('Elevated Card').parentElement;
    expect(card).toHaveClass('shadow-md');

    rerender(<Card variant="outlined">Outlined Card</Card>);
    card = screen.getByText('Outlined Card').parentElement;
    expect(card).toHaveClass('border');
  });

  it('renders loading state', () => {
    render(<Card loading>Loading Content</Card>);
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Loading Content')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation when clickable', () => {
    const handleClick = vi.fn();
    render(
      <Card clickable onClick={handleClick}>
        Keyboard Card
      </Card>
    );
    
    const card = screen.getByText('Keyboard Card').parentElement;
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    fireEvent.keyDown(card, { key: ' ' });
    expect(handleClick).toHaveBeenCalledTimes(2);
  });
});