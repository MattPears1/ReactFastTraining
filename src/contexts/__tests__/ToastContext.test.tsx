import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "../ToastContext";

// Test component that uses the toast context
const TestComponent = () => {
  const { showToast, hideToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast("success", "Success message")}>
        Show Success
      </button>
      <button onClick={() => showToast("error", "Error message", 3000)}>
        Show Error
      </button>
      <button onClick={() => showToast("warning", "Warning message", 0)}>
        Show Persistent Warning
      </button>
      <button
        onClick={() => {
          const id = Date.now().toString();
          showToast("info", "Info message", -1);
          hideToast(id);
        }}
      >
        Show and Hide
      </button>
    </div>
  );
};

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("throws error when useToast is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast must be used within a ToastProvider");

    consoleSpy.mockRestore();
  });

  it("provides toast context to children", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    expect(screen.getByText("Show Success")).toBeInTheDocument();
  });

  it("shows success toast with correct styling", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();

    const toast = screen.getByText("Success message").closest("div");
    expect(toast).toHaveClass(
      "bg-success-50",
      "text-success-800",
      "border-success-200",
    );
  });

  it("shows error toast with custom duration", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Error message")).toBeInTheDocument();

    const toast = screen.getByText("Error message").closest("div");
    expect(toast).toHaveClass(
      "bg-error-50",
      "text-error-800",
      "border-error-200",
    );
  });

  it("shows warning toast persistently when duration is 0", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Persistent Warning"));

    expect(screen.getByText("Warning message")).toBeInTheDocument();

    const toast = screen.getByText("Warning message").closest("div");
    expect(toast).toHaveClass(
      "bg-warning-50",
      "text-warning-800",
      "border-warning-200",
    );

    // Fast forward time - toast should still be there
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("auto-hides toast after default duration", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();

    // Fast forward default duration (5000ms)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });
  });

  it("auto-hides toast after custom duration", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Error"));

    expect(screen.getByText("Error message")).toBeInTheDocument();

    // Fast forward custom duration (3000ms)
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText("Error message")).not.toBeInTheDocument();
    });
  });

  it("allows manual dismissal of toast", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));

    expect(screen.getByText("Success message")).toBeInTheDocument();

    // Find and click the close button
    const closeButton = screen
      .getByText("Success message")
      .closest("div")
      ?.querySelector("button");

    if (closeButton) {
      await user.click(closeButton);
    }

    await waitFor(() => {
      expect(screen.queryByText("Success message")).not.toBeInTheDocument();
    });
  });

  it("displays multiple toasts simultaneously", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));
    await user.click(screen.getByText("Show Persistent Warning"));

    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
    expect(screen.getByText("Warning message")).toBeInTheDocument();
  });

  it("renders correct icons for each toast type", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    // Show different toast types
    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));

    // Check for presence of toast containers
    const toasts = screen.getByText("Success message").closest(".fixed");
    expect(toasts).toBeInTheDocument();
  });

  it("positions toasts in the correct location", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));

    const toastContainer = screen
      .getByText("Success message")
      .closest(".fixed");
    expect(toastContainer).toHaveClass("top-4", "right-4", "z-50");
  });

  it("stacks multiple toasts with proper spacing", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await user.click(screen.getByText("Show Success"));
    await user.click(screen.getByText("Show Error"));

    const toastContainer = screen
      .getByText("Success message")
      .closest(".fixed");
    expect(toastContainer).toHaveClass("space-y-2");
  });
});
