-- Multiusuario, paso 2 de 2.
--
-- Ya no hay filas sin dueño, así que user_id pasa a NOT NULL. Es la red de
-- seguridad: a partir de acá la base rechaza cualquier inserción que se olvide
-- del dueño, en vez de dejar una fila invisible para todos.

ALTER TABLE "categories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "subcategories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "income_categories" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "incomes" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "plan_items" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "user_id" SET NOT NULL;
