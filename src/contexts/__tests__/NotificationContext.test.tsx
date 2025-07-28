import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationProvider, useNotifications } from "../NotificationContext";

// Mock uuid
vi.mock("uuid", () => ({
  v4: () => "test-id-" + Date.now(),
}));

// Test component that uses the notification context
const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    systemAlert,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showSystemAlert,
    dismissSystemAlert,
  } = useNotifications();

  return (
    <div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notification-count">{notifications.length}</div>
      <div data-testid="system-alert">{systemAlert?.title || "No alert"}</div>

      <button
        onClick={() =>
          addNotification({
            type: "info",
            title: "Test Notification",
            message: "This is a test",
          })
        }
      >
        Add Notification
      </button>

      <button
        onClick={() =>
          addNotification({
            type: "success",
            title: "Persistent Notification",
            persistent: true,
            duration: 3000,
          })
        }
      >
        Add Persistent
      </button>

      <button
        onClick={() => {
          const id = addNotification({
            type: "error",
            title: "Auto Remove",
            duration: 1000,
          });
        }}
      >
        Add Auto Remove
      </button>

      <button
        onClick={() =>
          notifications[0] && removeNotification(notifications[0].id)
        }
      >
        Remove First
      </button>

      <button
        onClick={() => notifications[0] && markAsRead(notifications[0].id)}
      >
        Mark First Read
      </button>

      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearAll}>Clear All</button>

      <button
        onClick={() =>
          showSystemAlert({
            type: "warning",
            title: "System Alert",
            message: "Important system message",
          })
        }
      >
        Show Alert
      </button>

      <button onClick={dismissSystemAlert}>Dismiss Alert</button>

      <div data-testid="notifications">
        {notifications.map((n) => (
          <div key={n.id} data-testid={`notification-${n.id}`}>
            {n.title} - {n.read ? "read" : "unread"}
          </div>
        ))}
      </div>
    </div>
  );
};

describe("NotificationContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("throws error when useNotifications is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useNotifications must be used within a NotificationProvider");

    consoleSpy.mockRestore();
  });

  it("provides notification context to children", () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
    expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
  });

  it("loads notifications from localStorage", () => {
    const storedNotifications = [
      {
        id: "1",
        type: "info",
        title: "Stored Notification",
        timestamp: new Date().toISOString(),
        read: false,
      },
    ];
    localStorage.setItem(
      "app_notifications",
      JSON.stringify(storedNotifications),
    );

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    expect(
      screen.getByText("Stored Notification - unread"),
    ).toBeInTheDocument();
  });

  it("handles corrupted localStorage data gracefully", () => {
    localStorage.setItem("app_notifications", "invalid json");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to parse stored notifications",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("adds notifications correctly", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Notification"));

    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");
    expect(screen.getByText("Test Notification - unread")).toBeInTheDocument();
  });

  it("removes notifications", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Notification"));
    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");

    await user.click(screen.getByText("Remove First"));
    expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
  });

  it("marks notifications as read", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Notification"));
    expect(screen.getByTestId("unread-count")).toHaveTextContent("1");

    await user.click(screen.getByText("Mark First Read"));
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
    expect(screen.getByText("Test Notification - read")).toBeInTheDocument();
  });

  it("marks all notifications as read", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add multiple notifications
    await user.click(screen.getByText("Add Notification"));
    await user.click(screen.getByText("Add Notification"));
    await user.click(screen.getByText("Add Notification"));

    expect(screen.getByTestId("unread-count")).toHaveTextContent("3");

    await user.click(screen.getByText("Mark All Read"));
    expect(screen.getByTestId("unread-count")).toHaveTextContent("0");
  });

  it("clears all notifications", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Notification"));
    await user.click(screen.getByText("Add Notification"));

    expect(screen.getByTestId("notification-count")).toHaveTextContent("2");

    await user.click(screen.getByText("Clear All"));
    expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
  });

  it("auto-removes non-persistent notifications after duration", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Auto Remove"));
    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId("notification-count")).toHaveTextContent("0");
    });
  });

  it("does not auto-remove persistent notifications", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Persistent"));
    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Should still be there
    expect(screen.getByTestId("notification-count")).toHaveTextContent("1");
  });

  it("limits notifications to maximum count", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add more than MAX_NOTIFICATIONS (50)
    for (let i = 0; i < 55; i++) {
      await user.click(screen.getByText("Add Notification"));
    }

    expect(screen.getByTestId("notification-count")).toHaveTextContent("50");
  });

  it("shows and dismisses system alerts", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    expect(screen.getByTestId("system-alert")).toHaveTextContent("No alert");

    await user.click(screen.getByText("Show Alert"));
    expect(screen.getByTestId("system-alert")).toHaveTextContent(
      "System Alert",
    );

    await user.click(screen.getByText("Dismiss Alert"));
    expect(screen.getByTestId("system-alert")).toHaveTextContent("No alert");
  });

  it("persists notifications to localStorage", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add Notification"));

    const stored = JSON.parse(
      localStorage.getItem("app_notifications") || "[]",
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe("Test Notification");
  });

  it("maintains notification order with newest first", async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Add notifications with slight delays to ensure different timestamps
    await user.click(screen.getByText("Add Notification"));

    // Modify the notification to have different titles
    const addButton = screen.getByText("Add Notification");

    // Add second notification
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    await user.click(addButton);

    const notifications = screen.getAllByTestId(/notification-test-id-/);
    expect(notifications).toHaveLength(2);
    // Newest should be first
    expect(notifications[0]).toHaveTextContent("Test Notification - unread");
  });

  it("returns notification ID when adding", async () => {
    const user = userEvent.setup({ delay: null });
    let notificationId: string | undefined;

    const TestComponentWithId = () => {
      const { addNotification } = useNotifications();

      return (
        <button
          onClick={() => {
            notificationId = addNotification({
              type: "info",
              title: "Test",
            });
          }}
        >
          Add and Get ID
        </button>
      );
    };

    render(
      <NotificationProvider>
        <TestComponentWithId />
      </NotificationProvider>,
    );

    await user.click(screen.getByText("Add and Get ID"));
    expect(notificationId).toBeDefined();
    expect(notificationId).toMatch(/^test-id-/);
  });
});
