/**
 * Sesión de un solo usuario: una cookie firmada con HMAC-SHA256.
 * No guardamos nada en la base de datos.
 * Usa Web Crypto, así que funciona tanto en el middleware como en el servidor.
 */

export const SESSION_COOKIE = "fp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 60; // 60 días

/** Se recorta el valor: pegar una variable en un panel web suele arrastrar un salto de línea. */
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
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${await sign(String(expiresAt))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;
  if (Number(expiresAt) < Date.now()) return false;
  return safeEqual(signature, await sign(expiresAt));
}

export function checkPassword(input: string): boolean {
  const expected = process.env.APP_PASSWORD?.trim();
  if (!expected) throw new Error("Falta APP_PASSWORD en las variables de entorno.");
  return safeEqual(input, expected);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
} as const;
