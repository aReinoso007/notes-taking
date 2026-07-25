import { AuthForm } from "@/components/auth/AuthForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      heading="Yay, You're Back!"
      footerHref="/signup"
      footerLabel="Oops! I've never been here before"
      illustrationSrc="/auth-login.png"
      illustrationWidth={95}
      illustrationHeight={114}
    >
      <AuthForm mode="login" />
    </AuthLayout>
  );
}
