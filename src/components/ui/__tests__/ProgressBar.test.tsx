import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar Component", () => {
  it("renders with default props", () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("displays correct progress percentage", () => {
    render(<ProgressBar value={75} />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveStyle({ width: "75%" });
  });

  it("handles min and max values", () => {
    render(<ProgressBar value={50} min={0} max={200} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    expect(progressBar).toHaveAttribute("aria-valuemax", "200");

    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveStyle({ width: "25%" }); // 50/200 = 25%
  });

  it("clamps value within min and max", () => {
    const { rerender } = render(<ProgressBar value={150} max={100} />);
    let progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveStyle({ width: "100%" });

    rerender(<ProgressBar value={-10} min={0} />);
    progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveStyle({ width: "0%" });
  });

  it("shows label when showLabel is true", () => {
    render(<ProgressBar value={60} showLabel />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("formats label with custom formatter", () => {
    const formatter = (value: number) => `${value} of 100 completed`;
    render(<ProgressBar value={30} showLabel labelFormatter={formatter} />);
    expect(screen.getByText("30 of 100 completed")).toBeInTheDocument();
  });

  it("applies different sizes", () => {
    const { rerender } = render(<ProgressBar value={50} size="sm" />);
    let container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("h-1");

    rerender(<ProgressBar value={50} size="md" />);
    container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("h-2");

    rerender(<ProgressBar value={50} size="lg" />);
    container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("h-3");
  });

  it("applies different colors", () => {
    const { rerender } = render(<ProgressBar value={50} color="primary" />);
    let progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("bg-primary-600");

    rerender(<ProgressBar value={50} color="success" />);
    progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("bg-green-600");

    rerender(<ProgressBar value={50} color="danger" />);
    progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("bg-red-600");
  });

  it("shows indeterminate state", () => {
    render(<ProgressBar indeterminate />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("animate-progress-indeterminate");
    expect(progressFill).not.toHaveStyle({ width: "0%" });
  });

  it("applies striped pattern", () => {
    render(<ProgressBar value={50} striped />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("bg-stripes");
  });

  it("animates stripes when animated", () => {
    render(<ProgressBar value={50} striped animated />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("animate-stripes");
  });

  it("shows buffer for buffered progress", () => {
    render(<ProgressBar value={30} buffer={60} />);
    const buffer = screen.getByTestId("progress-buffer");
    expect(buffer).toBeInTheDocument();
    expect(buffer).toHaveStyle({ width: "60%" });
  });

  it("applies custom className", () => {
    render(<ProgressBar value={50} className="custom-progress" />);
    const container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("custom-progress");
  });

  it("handles rounded corners", () => {
    const { rerender } = render(<ProgressBar value={50} rounded />);
    let container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("rounded-full");

    rerender(<ProgressBar value={50} rounded={false} />);
    container = screen.getByTestId("progress-container");
    expect(container).not.toHaveClass("rounded-full");
  });

  it("shows multiple progress segments", () => {
    const segments = [
      { value: 25, color: "primary" },
      { value: 30, color: "success" },
      { value: 20, color: "warning" },
    ];

    render(<ProgressBar segments={segments} />);
    const progressSegments = screen.getAllByTestId(/progress-segment-/);
    expect(progressSegments).toHaveLength(3);

    expect(progressSegments[0]).toHaveStyle({ width: "25%" });
    expect(progressSegments[0]).toHaveClass("bg-primary-600");

    expect(progressSegments[1]).toHaveStyle({ width: "30%" });
    expect(progressSegments[1]).toHaveClass("bg-green-600");

    expect(progressSegments[2]).toHaveStyle({ width: "20%" });
    expect(progressSegments[2]).toHaveClass("bg-yellow-600");
  });

  it("animates value changes", async () => {
    const { rerender } = render(<ProgressBar value={0} animate />);
    const progressFill = screen.getByTestId("progress-fill");

    expect(progressFill).toHaveStyle({ width: "0%" });

    rerender(<ProgressBar value={100} animate />);

    await waitFor(() => {
      expect(progressFill).toHaveClass("transition-all", "duration-500");
    });
  });

  it("shows error state", () => {
    render(<ProgressBar value={50} error />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("bg-red-600");

    const container = screen.getByTestId("progress-container");
    expect(container).toHaveClass("ring-2", "ring-red-500");
  });

  it("supports custom height", () => {
    render(<ProgressBar value={50} height={20} />);
    const container = screen.getByTestId("progress-container");
    expect(container).toHaveStyle({ height: "20px" });
  });

  it("shows tooltip on hover", async () => {
    render(<ProgressBar value={75} showTooltip />);
    const progressFill = screen.getByTestId("progress-fill");

    // Simulate hover
    fireEvent.mouseEnter(progressFill);

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
      expect(screen.getByRole("tooltip")).toHaveTextContent("75%");
    });
  });

  it("handles accessibility attributes", () => {
    render(
      <ProgressBar
        value={50}
        ariaLabel="Upload progress"
        ariaLabelledby="upload-label"
      />,
    );

    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-label", "Upload progress");
    expect(progressBar).toHaveAttribute("aria-labelledby", "upload-label");
  });

  it("supports infinite progress", () => {
    render(<ProgressBar infinite />);
    const progressFill = screen.getByTestId("progress-fill");
    expect(progressFill).toHaveClass("animate-progress-infinite");
  });

  it("shows steps for stepped progress", () => {
    render(<ProgressBar value={3} max={5} steps={5} showSteps />);
    const steps = screen.getAllByTestId(/progress-step-/);
    expect(steps).toHaveLength(5);

    // First 3 steps should be active
    expect(steps[0]).toHaveClass("bg-primary-600");
    expect(steps[1]).toHaveClass("bg-primary-600");
    expect(steps[2]).toHaveClass("bg-primary-600");
    expect(steps[3]).toHaveClass("bg-gray-300");
    expect(steps[4]).toHaveClass("bg-gray-300");
  });
});
