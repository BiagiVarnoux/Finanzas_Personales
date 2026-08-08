import { AuthForm } from "@/components/auth-form";
import { register } from "../login/actions";

export default function RegisterPage() {
  return <AuthForm action={register} mode="registro" />;
}
