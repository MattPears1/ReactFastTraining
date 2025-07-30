import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ContactForm from "../ContactForm";
import { ToastProvider } from "@contexts/ToastContext";

const renderWithProviders = (component: React.ReactElement) => {
  return render(<ToastProvider>{component}</ToastProvider>);
};

describe("ContactForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    renderWithProviders(<ContactForm />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/first name must be at least 2 characters/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/last name must be at least 2 characters/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/please enter a valid email address/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/subject must be at least 5 characters/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/message must be at least 20 characters/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/you must agree to the privacy policy/i),
      ).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address/i),
      ).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    // Fill in the form
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/phone number/i), "+1234567890");
    await user.type(screen.getByLabelText(/company name/i), "Acme Inc");
    await user.type(screen.getByLabelText(/subject/i), "Test Subject");
    await user.type(
      screen.getByLabelText(/message/i),
      "This is a test message that is long enough",
    );
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/sending.../i)).toBeInTheDocument();
    });

    // Wait for success message
    await waitFor(
      () => {
        expect(
          screen.getByText(/message sent successfully/i),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("disables form while submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContactForm />);

    // Fill in valid data
    await user.type(screen.getByLabelText(/first name/i), "John");
    await user.type(screen.getByLabelText(/last name/i), "Doe");
    await user.type(
      screen.getByLabelText(/email address/i),
      "john@example.com",
    );
    await user.type(screen.getByLabelText(/subject/i), "Test Subject");
    await user.type(
      screen.getByLabelText(/message/i),
      "This is a test message that is long enough",
    );
    await user.click(screen.getByRole("checkbox"));

    const submitButton = screen.getByRole("button", { name: /send message/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(screen.getByLabelText(/first name/i)).toBeDisabled();
      expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    });
  });
});
