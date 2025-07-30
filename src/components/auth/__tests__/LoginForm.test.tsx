import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "../LoginForm";

// Helper function to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("LoginForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnSocialLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form elements", () => {
    renderWithRouter(<LoginForm />);

    // Check form fields
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Remember me")).toBeInTheDocument();

    // Check buttons and links
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument();

    // Check social login buttons
    expect(screen.getByRole("button", { name: "" })).toBeInTheDocument(); // Google button (has SVG, no text)
  });

  it("validates email field", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Try to submit with invalid email
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("validates password field", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Try to submit with short password
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "12345");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters"),
      ).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const rememberMeCheckbox = screen.getByLabelText("Remember me");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // Fill in valid data
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(rememberMeCheckbox);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        rememberMe: true,
      });
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = passwordInput.parentElement?.querySelector(
      'button[type="button"]',
    );

    expect(passwordInput.type).toBe("password");

    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput.type).toBe("text");

      await user.click(toggleButton);
      expect(passwordInput.type).toBe("password");
    }
  });

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    const slowSubmit = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      );

    renderWithRouter(<LoginForm onSubmit={slowSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Check loading state
    expect(
      screen.getByRole("button", { name: "Signing in..." }),
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Sign In" }),
      ).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it("displays error message on submission failure", async () => {
    const user = userEvent.setup();
    const failingSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Invalid credentials"));

    renderWithRouter(<LoginForm onSubmit={failingSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("handles generic error correctly", async () => {
    const user = userEvent.setup();
    const failingSubmit = vi.fn().mockRejectedValue("Something went wrong");

    renderWithRouter(<LoginForm onSubmit={failingSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Login failed. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("calls social login handlers", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm onSocialLogin={mockOnSocialLogin} />);

    const socialButtons = screen
      .getAllByRole("button")
      .filter((button) => button.querySelector("svg"));

    // Click Google button (first social button)
    await user.click(socialButtons[0]);
    expect(mockOnSocialLogin).toHaveBeenCalledWith("google");

    // Click GitHub button (second social button)
    await user.click(socialButtons[1]);
    expect(mockOnSocialLogin).toHaveBeenCalledWith("github");

    // Click Twitter button (third social button)
    await user.click(socialButtons[2]);
    expect(mockOnSocialLogin).toHaveBeenCalledWith("twitter");
  });

  it("navigates to correct links", () => {
    renderWithRouter(<LoginForm />);

    const forgotPasswordLink = screen.getByRole("link", {
      name: "Forgot password?",
    });
    const signUpLink = screen.getByRole("link", { name: "Sign up" });

    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    expect(signUpLink).toHaveAttribute("href", "/register");
  });

  it("clears error message when resubmitting", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("First error"))
      .mockResolvedValueOnce(undefined);

    renderWithRouter(<LoginForm onSubmit={mockSubmit} />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    // First submission - should fail
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeInTheDocument();
    });

    // Second submission - should succeed and clear error
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });
  });

  it("maintains form state when toggling password visibility", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
    const toggleButton = passwordInput.parentElement?.querySelector(
      'button[type="button"]',
    );

    // Type password
    await user.type(passwordInput, "mypassword");
    expect(passwordInput.value).toBe("mypassword");

    // Toggle visibility should not clear the value
    if (toggleButton) {
      await user.click(toggleButton);
      expect(passwordInput.value).toBe("mypassword");
      expect(passwordInput.type).toBe("text");
    }
  });

  it("renders with custom className", () => {
    const { container } = renderWithRouter(
      <LoginForm className="custom-class" />,
    );

    const formWrapper = container.querySelector(".custom-class");
    expect(formWrapper).toBeInTheDocument();
  });

  it("handles form submission without onSubmit prop", async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: "Sign In" });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Should not throw error
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
