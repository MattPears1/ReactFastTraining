import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BentoGrid from '../BentoGrid';

const mockItems = [
  {
    id: '1',
    title: 'Feature 1',
    description: 'Description 1',
    icon: <span data-testid="icon-1">🚀</span>,
    className: 'col-span-2',
  },
  {
    id: '2',
    title: 'Feature 2',
    description: 'Description 2',
    icon: <span data-testid="icon-2">💡</span>,
  },
  {
    id: '3',
    title: 'Feature 3',
    description: 'Description 3',
    icon: <span data-testid="icon-3">🎯</span>,
    className: 'row-span-2',
  },
  {
    id: '4',
    title: 'Feature 4',
    description: 'Description 4',
    image: '/feature4.jpg',
  },
];

describe('BentoGrid Component', () => {
  it('renders all grid items', () => {
    render(<BentoGrid items={mockItems} />);
    
    mockItems.forEach(item => {
      expect(screen.getByText(item.title)).toBeInTheDocument();
      if (item.description) {
        expect(screen.getByText(item.description)).toBeInTheDocument();
      }
    });
  });

  it('renders icons when provided', () => {
    render(<BentoGrid items={mockItems} />);
    
    expect(screen.getByTestId('icon-1')).toBeInTheDocument();
    expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    expect(screen.getByTestId('icon-3')).toBeInTheDocument();
  });

  it('renders images when provided', () => {
    render(<BentoGrid items={mockItems} />);
    
    const image = screen.getByAltText('Feature 4');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/feature4.jpg');
  });

  it('applies custom className to items', () => {
    render(<BentoGrid items={mockItems} />);
    
    const firstItem = screen.getByText('Feature 1').closest('.bento-item');
    expect(firstItem).toHaveClass('col-span-2');
    
    const thirdItem = screen.getByText('Feature 3').closest('.bento-item');
    expect(thirdItem).toHaveClass('row-span-2');
  });

  it('applies different column configurations', () => {
    const { rerender } = render(<BentoGrid items={mockItems} columns={2} />);
    let grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('md:grid-cols-2');
    
    rerender(<BentoGrid items={mockItems} columns={4} />);
    grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('md:grid-cols-4');
    
    rerender(<BentoGrid items={mockItems} columns={5} />);
    grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('md:grid-cols-5');
  });

  it('applies gap sizes correctly', () => {
    const { rerender } = render(<BentoGrid items={mockItems} gap="sm" />);
    let grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('gap-2');
    
    rerender(<BentoGrid items={mockItems} gap="lg" />);
    grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('gap-8');
  });

  it('handles click events on items', () => {
    const handleClick = vi.fn();
    const itemsWithClick = mockItems.map(item => ({
      ...item,
      onClick: () => handleClick(item.id),
    }));
    
    render(<BentoGrid items={itemsWithClick} />);
    
    const firstItem = screen.getByText('Feature 1').closest('.bento-item');
    fireEvent.click(firstItem!);
    
    expect(handleClick).toHaveBeenCalledWith('1');
  });

  it('shows hover effects when hoverable', () => {
    const itemsWithHover = mockItems.map(item => ({
      ...item,
      hoverable: true,
    }));
    
    render(<BentoGrid items={itemsWithHover} />);
    
    const firstItem = screen.getByText('Feature 1').closest('.bento-item');
    expect(firstItem).toHaveClass('hover:scale-105');
  });

  it('renders custom content when provided', () => {
    const itemsWithCustomContent = [
      {
        id: '1',
        title: 'Custom Item',
        customContent: <div data-testid="custom-content">Custom Content</div>,
      },
    ];
    
    render(<BentoGrid items={itemsWithCustomContent} />);
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('applies theme variants', () => {
    const { rerender } = render(<BentoGrid items={mockItems} variant="outlined" />);
    
    let items = screen.getAllByText(/Feature/).map(el => el.closest('.bento-item'));
    items.forEach(item => {
      expect(item).toHaveClass('border');
    });
    
    rerender(<BentoGrid items={mockItems} variant="filled" />);
    items = screen.getAllByText(/Feature/).map(el => el.closest('.bento-item'));
    items.forEach(item => {
      expect(item).toHaveClass('bg-gray-100');
    });
  });

  it('supports responsive behavior', () => {
    render(<BentoGrid items={mockItems} responsive />);
    
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'md:grid-cols-3');
  });

  it('renders with loading state', () => {
    render(<BentoGrid items={mockItems} loading />);
    
    const skeletons = screen.getAllByTestId('bento-skeleton');
    expect(skeletons).toHaveLength(mockItems.length);
  });

  it('handles empty items array', () => {
    render(<BentoGrid items={[]} />);
    
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toBeEmptyDOMElement();
  });

  it('applies custom grid className', () => {
    render(<BentoGrid items={mockItems} className="custom-grid" />);
    
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveClass('custom-grid');
  });

  it('supports auto-fit layout', () => {
    render(<BentoGrid items={mockItems} autoFit />);
    
    const grid = screen.getByTestId('bento-grid');
    expect(grid).toHaveStyle({
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    });
  });

  it('renders badges on items', () => {
    const itemsWithBadges = mockItems.map(item => ({
      ...item,
      badge: 'New',
    }));
    
    render(<BentoGrid items={itemsWithBadges} />);
    
    const badges = screen.getAllByText('New');
    expect(badges).toHaveLength(mockItems.length);
  });

  it('supports item animations', () => {
    render(<BentoGrid items={mockItems} animate />);
    
    const items = screen.getAllByText(/Feature/).map(el => el.closest('.bento-item'));
    items.forEach((item, index) => {
      expect(item).toHaveStyle({
        animationDelay: `${index * 100}ms`,
      });
    });
  });
});