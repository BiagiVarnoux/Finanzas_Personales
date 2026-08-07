"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, createSessionToken, sessionCookieOptions } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Escribí tu contraseña." };

  // Un respiro artificial para que probar contraseñas al tanteo sea lento.
  await new Promise((resolve) => setTimeout(resolve, 400));

  // checkPassword y createSessionToken tiran si faltan las variables de entorno.
  // Sin esto el usuario solo vería un 500 sin explicación.
  let token: string;
  try {
    if (!checkPassword(password)) return { error: "Contraseña incorrecta." };
    token = await createSessionToken();
  } catch (err) {
    console.error("Login mal configurado:", err);
    return {
      error:
        "El servidor no tiene configuradas APP_PASSWORD y AUTH_SECRET. Cargalas en Vercel y volvé a desplegar.",
    };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions);
  // redirect() va fuera del try: lanza una excepción propia que no hay que atrapar.
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
