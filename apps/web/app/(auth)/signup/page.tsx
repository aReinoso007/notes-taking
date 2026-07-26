import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  return (
    <AuthLayout
      heading="Yay, New Friend!"
      footerHref="/login"
      footerLabel="We're already friends!"
      illustrationSrc="/auth-signup.png"
      illustrationWidth={189}
      illustrationHeight={134}
    >
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
