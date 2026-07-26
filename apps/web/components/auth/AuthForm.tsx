"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { PillButton } from "@/components/PillButton";
import { PasswordField } from "@/components/auth/PasswordField";
import { TextField } from "@/components/auth/TextField";
import { ApiError, api } from "@/lib/api-client";

import styles from "./AuthForm.module.css";

type Mode = "login" | "signup";

type AuthFormProps = {
  mode: Mode;
};

type FieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

function validate(email: string, password: string, mode: Mode): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = "Enter a valid email.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (mode === "signup" && password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
}

function mapApiErrors(body: unknown): FieldErrors {
  if (!body || typeof body !== "object") {
    return { form: "Something went wrong. Try again." };
  }
  const data = body as Record<string, unknown>;
  const errors: FieldErrors = {};

  if (typeof data.email === "string") errors.email = data.email;
  if (Array.isArray(data.email)) errors.email = String(data.email[0]);
  if (typeof data.password === "string") errors.password = data.password;
  if (Array.isArray(data.password)) errors.password = String(data.password[0]);

  if (typeof data.detail === "string") errors.form = data.detail;
  if (Array.isArray(data.non_field_errors)) {
    errors.form = String(data.non_field_errors[0]);
  }

  if (!errors.email && !errors.password && !errors.form) {
    errors.form = "Something went wrong. Try again.";
  }
  return errors;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(email, password, mode);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      if (mode === "login") {
        await api.login(email.trim(), password);
      } else {
        await api.signup(email.trim(), password);
      }
      router.replace("/notes");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError || isApiErrorShape(err)) {
        setErrors(mapApiErrors((err as ApiError).body));
      } else {
        setErrors({ form: "Something went wrong. Try again." });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.stack}>
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
      </div>

      {errors.form ? (
        <p className={styles.formError} role="alert">
          {errors.form}
        </p>
      ) : null}

      <div className={styles.cta}>
        <PillButton type="submit" pending={pending} data-testid="auth-submit">
          {mode === "login" ? "Login" : "Sign Up"}
        </PillButton>
      </div>
    </form>
  );
}

function isApiErrorShape(err: unknown): err is { body: unknown; status: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "body" in err &&
    "status" in err
  );
}
