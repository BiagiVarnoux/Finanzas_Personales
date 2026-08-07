# Finanzas Personales

App para registrar gastos del mes y compararlos contra un plan mensual armado con
productos reales (1 litro de aceite = Bs 19,50). Pensada para usarse desde el celular.

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind 4
- **Neon** (Postgres) con **Drizzle ORM**
- Deploy en **Vercel**

## Cómo funciona

Hay tres piezas que se cruzan entre sí:

1. **Catálogo** — los productos que comprás, con su unidad de medida y el último precio
   que pagaste. Ej: `Aceite · litro · Bs 19,50`. Cada categoría (Alimentación, Servicios
   básicos, Higiene, Pasajes…) tiene subcategorías (Carne, Verduras, Luz, Agua…).
2. **Plan del mes** — lo que *pensás* gastar: 4 litros de aceite, 3 kg de carne molida,
   la luz, el internet. La app suma el total planificado.
3. **Gastos** — lo que *realmente* gastaste. Cada gasto se cruza con el plan producto por
   producto, y lo que compraste sin planificar aparece aparte como "fuera del plan".

Si registrás un gasto de algo que no está en el catálogo, se da de alta solo (podés
desmarcar la casilla si es una compra de una sola vez). El catálogo aprende el último
precio pagado cada vez que registrás una compra.

## Puesta en marcha

### 1. Crear la base de datos en Neon

1. Entrá a [console.neon.tech](https://console.neon.tech) y creá un proyecto
   (región recomendada: `AWS us-east-2` u otra cercana).
2. En **Connection Details**, copiá la connection string **pooled** — la que tiene
   `-pooler` en el host y termina en `?sslmode=require`.

### 2. Variables de entorno locales

Copiá el archivo de ejemplo y llenalo:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — la connection string de Neon.
- `APP_PASSWORD` — la contraseña con la que vas a entrar a la app.
- `AUTH_SECRET` — generalo con:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Crear las tablas y cargar los datos iniciales

```bash
npm run db:push
```

```bash
npm run db:seed
```

El seed carga 6 categorías con sus subcategorías y unos 20 productos de ejemplo con
precios de referencia. Todo eso lo podés editar después desde la pantalla **Catálogo**.

### 4. Correr en local

```bash
npm run dev
```

Abrí <http://localhost:3000> y entrá con la contraseña que pusiste en `APP_PASSWORD`.

## Deploy en Vercel

1. Subí el repo a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo.
3. En **Environment Variables** cargá las tres: `DATABASE_URL`, `APP_PASSWORD`,
   `AUTH_SECRET`. Usá los mismos valores del `.env.local`.
4. **Deploy**. Vercel detecta Next.js solo, no hay que configurar nada más.

Si preferís conectar Neon desde el marketplace de Vercel (Storage → Neon), la
integración inyecta `DATABASE_URL` sola y te ahorra el paso 3 para esa variable.

### Instalarla en el iPhone

Abrí la URL de Vercel en Safari → botón **Compartir** → **Añadir a pantalla de inicio**.
Queda como una app, sin barra del navegador.

## Comandos

| Comando               | Qué hace                                                  |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo                                     |
| `npm run build`       | Build de producción                                        |
| `npm run db:push`     | Sincroniza el esquema con la base (sin archivos de migración) |
| `npm run db:generate` | Genera el SQL de migración en `drizzle/`                   |
| `npm run db:seed`     | Carga categorías, subcategorías y productos de ejemplo     |
| `npm run db:studio`   | Explorador visual de la base de datos                      |

## Estructura

```
src/
├── app/
│   ├── (app)/              Pantallas con la barra de navegación
│   │   ├── page.tsx          Resumen del mes
│   │   ├── gastos/           Lista, alta y edición de gastos
│   │   ├── plan/             Plan mensual y comparación
│   │   └── catalogo/         Productos, categorías y subcategorías
│   ├── actions/            Server Actions (escrituras)
│   └── login/              Pantalla de acceso
├── components/             UI compartida
├── db/                     Esquema Drizzle y seed
├── lib/                    Consultas, formatos, fechas, sesión
└── proxy.ts                Portero: sin sesión, todo va a /login
```

## Notas

- La sesión es una cookie firmada con HMAC (`AUTH_SECRET`), válida 60 días. No hay
  tabla de usuarios: es una app de una sola persona.
- Los meses se calculan en hora de Bolivia (`America/La_Paz`), así un gasto cargado a
  las 11 de la noche del 31 no se va al mes siguiente.
- Los productos no se borran, se archivan: los gastos viejos los siguen referenciando.
