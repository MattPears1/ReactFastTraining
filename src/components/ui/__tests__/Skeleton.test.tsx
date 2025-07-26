import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton from '../Skeleton';

describe('Skeleton Component', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('applies different variants', () => {
    const { rerender } = render(<Skeleton variant="text" />);
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-4', 'rounded');

    rerender(<Skeleton variant="circular" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');

    rerender(<Skeleton variant="rectangular" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom width and height', () => {
    render(<Skeleton width={200} height={100} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({
      width: '200px',
      height: '100px',
    });
  });

  it('applies responsive width with percentage', () => {
    render(<Skeleton width="50%" height="20px" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({
      width: '50%',
      height: '20px',
    });
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });

  it('can disable animation', () => {
    render(<Skeleton animation={false} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).not.toHaveClass('animate-pulse');
  });

  it('supports wave animation', () => {
    render(<Skeleton animation="wave" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('animate-wave');
  });

  it('renders multiple skeletons with count prop', () => {
    render(<Skeleton count={3} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('applies spacing between multiple skeletons', () => {
    render(<Skeleton count={3} spacing={8} />);
    const container = screen.getByTestId('skeleton-container');
    expect(container).toHaveClass('space-y-2');
  });

  it('renders children when not loading', () => {
    render(
      <Skeleton loading={false}>
        <div>Actual content</div>
      </Skeleton>
    );
    
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    expect(screen.getByText('Actual content')).toBeInTheDocument();
  });

  it('renders skeleton when loading', () => {
    render(
      <Skeleton loading={true}>
        <div>Actual content</div>
      </Skeleton>
    );
    
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Actual content')).not.toBeInTheDocument();
  });

  it('renders inline skeleton', () => {
    render(<Skeleton inline />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('inline-block');
  });

  it('supports custom duration for animation', () => {
    render(<Skeleton duration={2} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({
      animationDuration: '2s',
    });
  });

  it('renders with dark mode variant', () => {
    render(<Skeleton theme="dark" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-gray-700');
  });

  it('renders with light mode variant', () => {
    render(<Skeleton theme="light" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-gray-200');
  });

  it('creates text skeleton with multiple lines', () => {
    render(<Skeleton variant="text" lines={3} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
    
    // Last line should be shorter
    expect(skeletons[2]).toHaveStyle({ width: '80%' });
  });

  it('renders avatar skeleton', () => {
    render(<Skeleton variant="avatar" size="lg" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full', 'w-16', 'h-16');
  });

  it('renders card skeleton preset', () => {
    render(<Skeleton variant="card" />);
    const container = screen.getByTestId('skeleton-card');
    
    // Should have image, title, and text skeletons
    expect(container.querySelector('.h-48')).toBeInTheDocument(); // Image
    expect(container.querySelector('.h-6')).toBeInTheDocument(); // Title
    expect(container.querySelectorAll('.h-4')).toHaveLength(3); // Text lines
  });

  it('renders table skeleton preset', () => {
    render(<Skeleton variant="table" rows={5} columns={4} />);
    const table = screen.getByTestId('skeleton-table');
    
    const rows = table.querySelectorAll('tr');
    expect(rows).toHaveLength(6); // 1 header + 5 body rows
    
    const headerCells = rows[0].querySelectorAll('th');
    expect(headerCells).toHaveLength(4);
    
    const bodyCells = rows[1].querySelectorAll('td');
    expect(bodyCells).toHaveLength(4);
  });

  it('applies rounded corners based on variant', () => {
    const { rerender } = render(<Skeleton rounded="sm" />);
    let skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-sm');

    rerender(<Skeleton rounded="lg" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-lg');

    rerender(<Skeleton rounded="full" />);
    skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('supports gradient animation', () => {
    render(<Skeleton animation="gradient" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-gradient-to-r', 'animate-gradient');
  });
});