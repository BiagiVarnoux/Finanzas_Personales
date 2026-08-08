-- Transferencias entre cuentas propias.
--
-- Tabla aparte y no un gasto + un ingreso: mover plata del banco al efectivo no
-- es ni gastar ni ganar, y registrarlo como esos dos movimientos inflaría los
-- totales del mes con plata que nunca entró ni salió.

CREATE TABLE "transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"transferred_on" date NOT NULL,
	"period" varchar(7) NOT NULL,
	"from_account_id" integer NOT NULL,
	"to_account_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade;--> statement-breakpoint
-- Nunca de una cuenta a sí misma.
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_distintas_check" CHECK ("from_account_id" <> "to_account_id");--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_monto_positivo_check" CHECK ("amount" > 0);--> statement-breakpoint
CREATE INDEX "transfers_user_period_idx" ON "transfers" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX "transfers_from_idx" ON "transfers" USING btree ("from_account_id");--> statement-breakpoint
CREATE INDEX "transfers_to_idx" ON "transfers" USING btree ("to_account_id");
