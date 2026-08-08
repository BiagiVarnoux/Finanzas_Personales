import { AuthForm } from "@/components/auth-form";
import { login } from "./actions";

export default function LoginPage() {
  return <AuthForm action={login} mode="login" />;
}
