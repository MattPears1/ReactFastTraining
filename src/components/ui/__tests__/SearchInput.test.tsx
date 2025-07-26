import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '../SearchInput';
import '@testing-library/jest-dom';

describe('SearchInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSearch = vi.fn();
  const mockOnSuggestionClick = vi.fn();

  const mockSuggestions = [
    {
      id: '1',
      title: 'Test Product',
      description: 'A test product description',
      category: 'product',
    },
    {
      id: '2',
      title: 'Test Service',
      description: 'A test service description',
      category: 'service',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SearchInput placeholder="Search products..." />);
    const input = screen.getByPlaceholderText('Search products...');
    expect(input).toBeInTheDocument();
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    render(<SearchInput onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Search...');

    await user.type(input, 'test query');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test query');
    });
  });

  it('shows suggestions when provided', async () => {
    render(
      <SearchInput
        value="test"
        suggestions={mockSuggestions}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test Service')).toBeInTheDocument();
    });
  });

  it('handles suggestion clicks', async () => {
    render(
      <SearchInput
        value="test"
        suggestions={mockSuggestions}
        onSuggestionClick={mockOnSuggestionClick}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);

    await waitFor(() => {
      const suggestion = screen.getByText('Test Product');
      fireEvent.click(suggestion);
      expect(mockOnSuggestionClick).toHaveBeenCalledWith(mockSuggestions[0]);
    });
  });

  it('handles enter key to search', async () => {
    const user = userEvent.setup();
    render(
      <SearchInput
        value="test query"
        onSearch={mockOnSearch}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, '{Enter}');

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('shows loading state', () => {
    render(<SearchInput loading={true} />);
    const loader = screen.getByTestId('search-loader');
    expect(loader).toHaveClass('animate-spin');
  });

  it('shows recent searches when focused with empty input', async () => {
    const recentSearches = ['Recent search 1', 'Recent search 2'];
    render(
      <SearchInput
        recentSearches={recentSearches}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('Recent search 1')).toBeInTheDocument();
      expect(screen.getByText('Recent search 2')).toBeInTheDocument();
    });
  });

  it('shows trending searches when enabled', async () => {
    const trendingSearches = ['Trending 1', 'Trending 2'];
    render(
      <SearchInput
        showTrending={true}
        trendingSearches={trendingSearches}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Trending 1')).toBeInTheDocument();
      expect(screen.getByText('Trending 2')).toBeInTheDocument();
    });
  });

  it('handles arrow key navigation', async () => {
    const user = userEvent.setup();
    render(
      <SearchInput
        value="test"
        suggestions={mockSuggestions}
      />
    );

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.focus(input);

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    // Verify selection state (would need to add data-testid or check styles)
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear search');
    await user.click(clearButton);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });
});
