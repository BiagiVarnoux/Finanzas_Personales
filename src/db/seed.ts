import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

/** Categorías y subcategorías iniciales. Podés editar todo después desde /catalogo. */
const CATALOGO: Array<{
  name: string;
  icon: string;
  color: string;
  subcategories: string[];
}> = [
  {
    name: "Alimentación",
    icon: "🍽️",
    color: "#f97316",
    subcategories: [
      "Carne",
      "Verduras",
      "Frutas",
      "Abarrotes",
      "Lácteos y huevos",
      "Pan y cereales",
      "Bebidas",
      "Comida fuera de casa",
    ],
  },
  {
    name: "Servicios básicos",
    icon: "💡",
    color: "#eab308",
    subcategories: ["Luz", "Agua", "Internet", "Gas", "Teléfono"],
  },
  {
    name: "Higiene",
    icon: "🧼",
    color: "#06b6d4",
    subcategories: ["Aseo personal", "Limpieza del hogar", "Farmacia"],
  },
  {
    name: "Pasajes",
    icon: "🚌",
    color: "#8b5cf6",
    subcategories: ["Micro / trufi", "Taxi", "Combustible"],
  },
  {
    name: "Hogar",
    icon: "🏠",
    color: "#14b8a6",
    subcategories: ["Alquiler", "Mantenimiento", "Utensilios"],
  },
  {
    name: "Otros",
    icon: "📦",
    color: "#64748b",
    subcategories: ["Ocio", "Ropa", "Salud", "Imprevistos"],
  },
];

/** Un par de productos de ejemplo para que la app no arranque vacía. */
const PRODUCTOS: Array<{
  name: string;
  unit: string;
  lastPrice: string;
  category: string;
  subcategory: string;
}> = [
  { name: "Aceite", unit: "litro", lastPrice: "19.50", category: "Alimentación", subcategory: "Abarrotes" },
  { name: "Carne molida", unit: "kg", lastPrice: "38.00", category: "Alimentación", subcategory: "Carne" },
  { name: "Arroz", unit: "kg", lastPrice: "8.00", category: "Alimentación", subcategory: "Abarrotes" },
  { name: "Azúcar", unit: "kg", lastPrice: "7.00", category: "Alimentación", subcategory: "Abarrotes" },
  { name: "Papa", unit: "arroba", lastPrice: "60.00", category: "Alimentación", subcategory: "Verduras" },
  { name: "Tomate", unit: "kg", lastPrice: "9.00", category: "Alimentación", subcategory: "Verduras" },
  { name: "Cebolla", unit: "kg", lastPrice: "7.00", category: "Alimentación", subcategory: "Verduras" },
  { name: "Huevos", unit: "maple", lastPrice: "28.00", category: "Alimentación", subcategory: "Lácteos y huevos" },
  { name: "Leche", unit: "litro", lastPrice: "7.50", category: "Alimentación", subcategory: "Lácteos y huevos" },
  { name: "Pan", unit: "unidad", lastPrice: "0.50", category: "Alimentación", subcategory: "Pan y cereales" },
  { name: "Pollo", unit: "kg", lastPrice: "18.00", category: "Alimentación", subcategory: "Carne" },
  { name: "Luz", unit: "mes", lastPrice: "150.00", category: "Servicios básicos", subcategory: "Luz" },
  { name: "Agua", unit: "mes", lastPrice: "80.00", category: "Servicios básicos", subcategory: "Agua" },
  { name: "Internet", unit: "mes", lastPrice: "250.00", category: "Servicios básicos", subcategory: "Internet" },
  { name: "Garrafa de gas", unit: "unidad", lastPrice: "22.50", category: "Servicios básicos", subcategory: "Gas" },
  { name: "Papel higiénico", unit: "paquete", lastPrice: "18.00", category: "Higiene", subcategory: "Limpieza del hogar" },
  { name: "Detergente", unit: "kg", lastPrice: "25.00", category: "Higiene", subcategory: "Limpieza del hogar" },
  { name: "Jabón de tocador", unit: "unidad", lastPrice: "5.00", category: "Higiene", subcategory: "Aseo personal" },
  { name: "Pasta dental", unit: "unidad", lastPrice: "15.00", category: "Higiene", subcategory: "Aseo personal" },
  { name: "Pasaje micro", unit: "viaje", lastPrice: "2.30", category: "Pasajes", subcategory: "Micro / trufi" },
];

async function main() {
  const { db } = await import("./index");
  const { categories, subcategories, products } = await import("./schema");

  console.log("Cargando categorías...");
  const categoryIdByName = new Map<string, number>();
  for (const [i, cat] of CATALOGO.entries()) {
    const [row] = await db
      .insert(categories)
      .values({ name: cat.name, icon: cat.icon, color: cat.color, sortOrder: i })
      .onConflictDoUpdate({
        target: categories.name,
        set: { icon: cat.icon, color: cat.color, sortOrder: i },
      })
      .returning({ id: categories.id });
    categoryIdByName.set(cat.name, row.id);
  }

  console.log("Cargando subcategorías...");
  const subcategoryIdByKey = new Map<string, number>();
  for (const cat of CATALOGO) {
    const categoryId = categoryIdByName.get(cat.name)!;
    for (const [i, name] of cat.subcategories.entries()) {
      const [row] = await db
        .insert(subcategories)
        .values({ categoryId, name, sortOrder: i })
        .onConflictDoUpdate({
          target: [subcategories.categoryId, subcategories.name],
          set: { sortOrder: i },
        })
        .returning({ id: subcategories.id });
      subcategoryIdByKey.set(`${cat.name}::${name}`, row.id);
    }
  }

  console.log("Cargando productos de ejemplo...");
  for (const p of PRODUCTOS) {
    await db
      .insert(products)
      .values({
        name: p.name,
        unit: p.unit,
        lastPrice: p.lastPrice,
        categoryId: categoryIdByName.get(p.category)!,
        subcategoryId: subcategoryIdByKey.get(`${p.category}::${p.subcategory}`) ?? null,
      })
      .onConflictDoNothing({ target: [products.name, products.unit] });
  }

  console.log(
    `Listo: ${CATALOGO.length} categorías, ` +
      `${CATALOGO.reduce((n, c) => n + c.subcategories.length, 0)} subcategorías, ` +
      `${PRODUCTOS.length} productos.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
