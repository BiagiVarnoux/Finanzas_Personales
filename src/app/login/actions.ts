"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  checkPasswordStrength,
  hashPassword,
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "@/lib/password";
import { SESSION_COOKIE, createSessionToken, safeEqual, sessionCookieOptions } from "@/lib/session";

export type AuthState = { error?: string };

/**
 * Hash descartable con el que se compara cuando el correo no existe. Sirve para
 * que la respuesta tarde lo mismo exista o no la cuenta, y no se pueda averiguar
 * quién está registrado midiendo el tiempo.
 */
const DUMMY_HASH =
  "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

async function startSession(userId: number) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(userId), sessionCookieOptions);
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Escribí tu correo y tu contraseña." };

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

  // El mismo mensaje en los dos casos: no delatamos qué correos existen.
  if (!user || !ok) return { error: "Correo o contraseña incorrectos." };

  await startSession(user.id);
  redirect("/");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const expectedCode = process.env.SIGNUP_CODE?.trim();
  if (!expectedCode) {
    return { error: "El registro está cerrado: falta configurar SIGNUP_CODE en el servidor." };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!safeEqual(code, expectedCode)) return { error: "El código de invitación no es válido." };

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) return { error: "Ese correo no parece válido." };

  const password = String(formData.get("password") ?? "");
  const weak = checkPasswordStrength(password);
  if (weak) return { error: weak };

  if (password !== String(formData.get("passwordConfirm") ?? "")) {
    return { error: "Las dos contraseñas no coinciden." };
  }

  const name = String(formData.get("name") ?? "").trim() || null;

  let userId: number;
  try {
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword(password), name })
      .returning({ id: users.id });
    userId = created.id;
  } catch {
    // Choca con users_email_unique.
    return { error: "Ya existe una cuenta con ese correo." };
  }

  await startSession(userId);
  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
