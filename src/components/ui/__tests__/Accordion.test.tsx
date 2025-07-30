import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Accordion from "../Accordion";

const mockItems = [
  {
    id: "1",
    title: "What is React?",
    content: "React is a JavaScript library for building user interfaces.",
  },
  {
    id: "2",
    title: "How does TypeScript work?",
    content:
      "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.",
  },
  {
    id: "3",
    title: "What is Vite?",
    content:
      "Vite is a build tool that aims to provide a faster and leaner development experience.",
  },
];

describe("Accordion Component", () => {
  it("renders all accordion items", () => {
    render(<Accordion items={mockItems} />);

    mockItems.forEach((item) => {
      expect(screen.getByText(item.title)).toBeInTheDocument();
    });
  });

  it("expands item when clicked", async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });

    // Content should not be visible initially
    expect(screen.queryByText(mockItems[0].content)).not.toBeInTheDocument();

    // Click to expand
    await user.click(firstItemButton);

    // Content should be visible
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });
  });

  it("collapses item when clicked again", async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });

    // Expand
    await user.click(firstItemButton);
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });

    // Collapse
    await user.click(firstItemButton);
    await waitFor(() => {
      expect(screen.queryByText(mockItems[0].content)).not.toBeInTheDocument();
    });
  });

  it("allows multiple items to be open when multiple is true", async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} multiple />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });
    const secondItemButton = screen.getByRole("button", {
      name: mockItems[1].title,
    });

    // Open first item
    await user.click(firstItemButton);
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });

    // Open second item
    await user.click(secondItemButton);
    await waitFor(() => {
      expect(screen.getByText(mockItems[1].content)).toBeInTheDocument();
      // First item should still be open
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });
  });

  it("only allows one item open when multiple is false", async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} multiple={false} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });
    const secondItemButton = screen.getByRole("button", {
      name: mockItems[1].title,
    });

    // Open first item
    await user.click(firstItemButton);
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });

    // Open second item
    await user.click(secondItemButton);
    await waitFor(() => {
      expect(screen.getByText(mockItems[1].content)).toBeInTheDocument();
      // First item should be closed
      expect(screen.queryByText(mockItems[0].content)).not.toBeInTheDocument();
    });
  });

  it("opens default items on mount", () => {
    render(<Accordion items={mockItems} defaultOpen={["1", "3"]} multiple />);

    expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    expect(screen.queryByText(mockItems[1].content)).not.toBeInTheDocument();
    expect(screen.getByText(mockItems[2].content)).toBeInTheDocument();
  });

  it("handles keyboard navigation", async () => {
    const user = userEvent.setup();
    render(<Accordion items={mockItems} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });

    // Focus on the button
    firstItemButton.focus();
    expect(document.activeElement).toBe(firstItemButton);

    // Press Enter to expand
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByText(mockItems[0].content)).toBeInTheDocument();
    });

    // Press Space to collapse
    await user.keyboard(" ");
    await waitFor(() => {
      expect(screen.queryByText(mockItems[0].content)).not.toBeInTheDocument();
    });
  });

  it("supports custom icons", () => {
    const CustomIcon = ({ isOpen }: { isOpen: boolean }) => (
      <span data-testid="custom-icon">{isOpen ? "−" : "+"}</span>
    );

    render(<Accordion items={mockItems} icon={CustomIcon} />);

    const icons = screen.getAllByTestId("custom-icon");
    expect(icons).toHaveLength(mockItems.length);
    expect(icons[0]).toHaveTextContent("+");
  });

  it("calls onChange callback when items are toggled", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Accordion items={mockItems} onChange={handleChange} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });

    await user.click(firstItemButton);
    expect(handleChange).toHaveBeenCalledWith(["1"]);

    await user.click(firstItemButton);
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it("applies custom className", () => {
    render(<Accordion items={mockItems} className="custom-accordion" />);

    const accordion = screen.getByRole("region");
    expect(accordion).toHaveClass("custom-accordion");
  });

  it("applies custom item className", () => {
    const itemsWithClass = mockItems.map((item) => ({
      ...item,
      className: "custom-item",
    }));

    render(<Accordion items={itemsWithClass} />);

    const buttons = screen.getAllByRole("button");
    buttons.forEach((button) => {
      expect(button.parentElement).toHaveClass("custom-item");
    });
  });

  it("disables items when specified", async () => {
    const user = userEvent.setup();
    const itemsWithDisabled = mockItems.map((item, index) => ({
      ...item,
      disabled: index === 1,
    }));

    render(<Accordion items={itemsWithDisabled} />);

    const secondItemButton = screen.getByRole("button", {
      name: mockItems[1].title,
    });
    expect(secondItemButton).toBeDisabled();

    await user.click(secondItemButton);
    expect(screen.queryByText(mockItems[1].content)).not.toBeInTheDocument();
  });

  it("renders with correct ARIA attributes", () => {
    render(<Accordion items={mockItems} defaultOpen={["1"]} />);

    const firstItemButton = screen.getByRole("button", {
      name: mockItems[0].title,
    });
    const secondItemButton = screen.getByRole("button", {
      name: mockItems[1].title,
    });

    expect(firstItemButton).toHaveAttribute("aria-expanded", "true");
    expect(secondItemButton).toHaveAttribute("aria-expanded", "false");

    const firstPanel = screen.getByText(mockItems[0].content).parentElement;
    expect(firstPanel).toHaveAttribute("role", "region");
    expect(firstPanel).toHaveAttribute("aria-labelledby");
  });
});
