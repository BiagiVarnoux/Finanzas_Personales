/**
 * Sesión: una cookie firmada con HMAC-SHA256 que lleva adentro el id del
 * usuario y el vencimiento. No hay tabla de sesiones.
 *
 * Usa Web Crypto a propósito: este módulo lo importa el proxy, que corre en el
 * runtime edge y no tiene node:crypto. El hasheo de contraseñas vive aparte,
 * en password.ts.
 */

export const SESSION_COOKIE = "fp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 días

function secret(): string {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) throw new Error("Falta AUTH_SECRET en las variables de entorno.");
  return value;
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparación en tiempo constante, para no filtrar información por el tiempo de respuesta. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(userId: number): Promise<string> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

/** Devuelve el id del usuario, o null si la cookie no vale. */
export async function readSessionToken(token: string | undefined): Promise<number | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [rawUserId, expiresAt, signature] = parts;
  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  if (!Number(expiresAt) || Number(expiresAt) < Date.now()) return null;

  const expected = await sign(`${rawUserId}.${expiresAt}`);
  return safeEqual(signature, expected) ? userId : null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;
