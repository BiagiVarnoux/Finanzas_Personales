import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, readSessionToken } from "./session";

/**
 * El id del usuario de la sesión. Toda consulta y toda escritura pasa por acá:
 * es el único lugar del que sale el user_id que después filtra los datos.
 *
 * Si no hay sesión válida manda al login. El proxy ya lo hace antes, así que
 * esto es la segunda barrera, no la primera.
 */
export async function requireUserId(): Promise<number> {
  const store = await cookies();
  const userId = await readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!userId) redirect("/login");
  return userId;
}

export async function getCurrentUser() {
  const userId = await requireUserId();
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // La cookie está firmada pero el usuario ya no existe: sesión inválida.
  if (!user) redirect("/login");
  return user;
}
