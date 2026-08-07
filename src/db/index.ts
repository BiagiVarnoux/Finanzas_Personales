import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | null = null;

function connect(): Database {
  if (instance) return instance;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Falta DATABASE_URL. Copiá .env.example a .env.local y pegá la URL de Neon.");
  }
  instance = drizzle(neon(url), { schema });
  return instance;
}

/**
 * Proxy en vez de una instancia directa: así `next build` puede importar este
 * módulo sin tener DATABASE_URL, y la conexión recién se arma en la primera
 * consulta real.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    const value = Reflect.get(connect(), property, receiver);
    return typeof value === "function" ? value.bind(connect()) : value;
  },
});

export { schema };
