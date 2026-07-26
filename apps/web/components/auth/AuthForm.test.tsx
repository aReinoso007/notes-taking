import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const login = vi.fn();
const signup = vi.fn();

vi.mock("@/lib/api-client", async () => {
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super("api");
      this.status = status;
      this.body = body;
    }
  }
  return {
    ApiError,
    api: {
      login: (...args: unknown[]) => login(...args),
      signup: (...args: unknown[]) => signup(...args),
    },
  };
});

import { AuthForm } from "./AuthForm";
import { AuthLayout } from "./AuthLayout";
import { PasswordField } from "./PasswordField";
import { ApiError } from "@/lib/api-client";

describe("PasswordField reveal toggle", () => {
  afterEach(() => {
    cleanup();
  });

  it("toggles type between password and text and stays in tab order", async () => {
    const user = userEvent.setup();
    render(
      <PasswordField id="password" label="Password" placeholder="Password" />,
    );

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("AuthForm validation and submit", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    login.mockReset();
    signup.mockReset();
    replace.mockReset();
    refresh.mockReset();
  });

  it("shows validation errors and does not submit", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.click(screen.getByTestId("auth-submit"));

    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Password is required.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects malformed email", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByTestId("auth-submit"));

    expect(screen.getByText("Enter a valid email.")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("submits login and redirects to /notes", async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ user: { id: 1, email: "a@example.com" } });
    render(<AuthForm mode="login" />);

    await user.type(screen.getByLabelText("Email"), "a@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByTestId("auth-submit"));

    expect(login).toHaveBeenCalledWith("a@example.com", "securepass1");
    expect(replace).toHaveBeenCalledWith("/notes");
  });

  it("renders API field errors in heading colour alert", async () => {
    const user = userEvent.setup();
    signup.mockRejectedValue(
      new ApiError(400, { email: ["A user with this email already exists."] }),
    );
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Email"), "dup@example.com");
    await user.type(screen.getByLabelText("Password"), "securepass1");
    await user.click(screen.getByTestId("auth-submit"));

    expect(
      await screen.findByText("A user with this email already exists."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("AuthLayout", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders shared heading and footer link", () => {
    render(
      <AuthLayout
        heading="Yay, You're Back!"
        footerHref="/signup"
        footerLabel="Oops! I've never been here before"
        illustrationSrc="/auth-login.png"
        illustrationWidth={95}
        illustrationHeight={114}
      >
        <div>form</div>
      </AuthLayout>,
    );

    expect(
      screen.getByRole("heading", { name: "Yay, You're Back!" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Oops! I've never been here before" }),
    ).toHaveAttribute("href", "/signup");
  });
});
