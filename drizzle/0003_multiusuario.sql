-- Multiusuario, paso 1 de 2.
--
-- user_id entra como NULLABLE a propósito: las tablas ya tienen filas y todavía
-- no existe ningún usuario a quien asignárselas. Una vez que el dueño se
-- registre y se le transfieran las filas huérfanas, la migración 0004 lo pone
-- en NOT NULL.
--
-- Mientras tanto no hay riesgo de fuga: todas las consultas filtran por
-- user_id, así que una fila con user_id NULL no aparece para nadie.

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "subcategories" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "income_categories" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "plan_items" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "user_id" integer;--> statement-breakpoint

ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "plan_items" ADD CONSTRAINT "plan_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint

-- Los nombres pasan a ser únicos por usuario, no en toda la base: dos personas
-- distintas pueden tener cada una su categoría "Alimentación".
ALTER TABLE "categories" DROP CONSTRAINT "categories_name_unique";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_name_unique" UNIQUE("user_id","name");--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_name_unique";--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_name_unique" UNIQUE("user_id","name");--> statement-breakpoint
ALTER TABLE "income_categories" DROP CONSTRAINT "income_categories_name_unique";--> statement-breakpoint
ALTER TABLE "income_categories" ADD CONSTRAINT "income_categories_user_name_unique" UNIQUE("user_id","name");--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_name_unit_unique";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_name_unit_unique" UNIQUE("user_id","name","unit");--> statement-breakpoint

CREATE INDEX "categories_user_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subcategories_user_idx" ON "subcategories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "products_user_idx" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "income_categories_user_idx" ON "income_categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "incomes_user_period_idx" ON "incomes" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX "plan_items_user_period_idx" ON "plan_items" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX "expenses_user_period_idx" ON "expenses" USING btree ("user_id","period");
