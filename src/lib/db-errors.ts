import "server-only";

/** 23505 = unique_violation en Postgres. */
const UNIQUE_VIOLATION = "23505";

/**
 * Distingue "ya existe uno igual" de cualquier otro fallo. Sin esto, un
 * try/catch alrededor de un insert le echa la culpa al nombre duplicado aunque
 * el problema haya sido otro, y el mensaje en pantalla manda a buscar donde no
 * es. Lo que no sea duplicado se registra en el log del servidor.
 */
export function isDuplicate(error: unknown, context: string): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === UNIQUE_VIOLATION) return true;
  console.error(`[${context}] fallo inesperado en la base:`, error);
  return false;
}
