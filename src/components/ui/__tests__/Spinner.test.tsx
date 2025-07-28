import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "../Spinner";

describe("Spinner Component", () => {
  it("renders with default props", () => {
    render(<Spinner />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass("animate-spin");
  });

  it("applies different sizes", () => {
    const { rerender } = render(<Spinner size="sm" />);
    let spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("w-4", "h-4");

    rerender(<Spinner size="md" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("w-8", "h-8");

    rerender(<Spinner size="lg" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("w-12", "h-12");

    rerender(<Spinner size="xl" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("w-16", "h-16");
  });

  it("applies custom size", () => {
    render(<Spinner size={24} />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveStyle({
      width: "24px",
      height: "24px",
    });
  });

  it("applies different colors", () => {
    const { rerender } = render(<Spinner color="primary" />);
    let spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("text-primary-600");

    rerender(<Spinner color="secondary" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("text-secondary-600");

    rerender(<Spinner color="white" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("text-white");
  });

  it("applies custom className", () => {
    render(<Spinner className="custom-spinner" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("custom-spinner");
  });

  it("renders with label", () => {
    render(<Spinner label="Loading..." />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("applies label position", () => {
    const { rerender } = render(
      <Spinner label="Loading" labelPosition="bottom" />,
    );
    let container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("flex-col");

    rerender(<Spinner label="Loading" labelPosition="right" />);
    container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("flex-row");

    rerender(<Spinner label="Loading" labelPosition="top" />);
    container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("flex-col-reverse");

    rerender(<Spinner label="Loading" labelPosition="left" />);
    container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("flex-row-reverse");
  });

  it("renders fullscreen overlay", () => {
    render(<Spinner fullscreen />);
    const overlay = screen.getByTestId("spinner-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass("fixed", "inset-0", "z-50");
  });

  it("applies backdrop blur when fullscreen", () => {
    render(<Spinner fullscreen backdrop="blur" />);
    const overlay = screen.getByTestId("spinner-overlay");
    expect(overlay).toHaveClass("backdrop-blur-sm");
  });

  it("applies dark backdrop when fullscreen", () => {
    render(<Spinner fullscreen backdrop="dark" />);
    const overlay = screen.getByTestId("spinner-overlay");
    expect(overlay).toHaveClass("bg-black/50");
  });

  it("centers content when centered", () => {
    render(<Spinner center />);
    const container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("justify-center", "items-center");
  });

  it("applies thickness variants", () => {
    const { rerender } = render(<Spinner thickness="thin" />);
    let spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("border-2");

    rerender(<Spinner thickness="normal" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("border-4");

    rerender(<Spinner thickness="thick" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("border-8");
  });

  it("applies speed variants", () => {
    const { rerender } = render(<Spinner speed="slow" />);
    let spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveStyle({ animationDuration: "1.5s" });

    rerender(<Spinner speed="normal" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveStyle({ animationDuration: "1s" });

    rerender(<Spinner speed="fast" />);
    spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveStyle({ animationDuration: "0.5s" });
  });

  it("renders with track", () => {
    render(<Spinner track />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("border-gray-200");
  });

  it("applies custom track color", () => {
    render(<Spinner track trackColor="bg-gray-400" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("bg-gray-400");
  });

  it("supports different spinner types", () => {
    const { rerender } = render(<Spinner type="circle" />);
    let spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveClass("rounded-full");

    rerender(<Spinner type="dots" />);
    const dotsContainer = screen.getByTestId("spinner-dots");
    expect(dotsContainer).toBeInTheDocument();
    const dots = dotsContainer.querySelectorAll(".animate-bounce");
    expect(dots).toHaveLength(3);

    rerender(<Spinner type="bars" />);
    const barsContainer = screen.getByTestId("spinner-bars");
    expect(barsContainer).toBeInTheDocument();
    const bars = barsContainer.querySelectorAll(".animate-pulse");
    expect(bars).toHaveLength(3);
  });

  it("renders inline spinner", () => {
    render(<Spinner inline />);
    const container = screen.getByTestId("spinner-container");
    expect(container).toHaveClass("inline-flex");
  });

  it("applies aria attributes for accessibility", () => {
    render(<Spinner label="Loading data" />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveAttribute("role", "status");
    expect(spinner).toHaveAttribute("aria-label", "Loading data");
  });

  it("hides from screen readers when decorative", () => {
    render(<Spinner decorative />);
    const spinner = screen.getByTestId("spinner");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    expect(spinner).not.toHaveAttribute("role");
  });

  it("supports custom spinner content", () => {
    render(
      <Spinner
        custom={
          <div data-testid="custom-spinner">Custom Loading Animation</div>
        }
      />,
    );

    expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  });

  it("applies delay before showing", async () => {
    const { rerender } = render(<Spinner delay={0} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    rerender(<Spinner delay={500} />);
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();

    // Note: In a real test, we would wait for the delay
    // For now, we're just testing the initial state
  });
});
