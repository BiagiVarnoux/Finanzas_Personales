CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text DEFAULT '💵' NOT NULL,
	"color" text DEFAULT '#10794f' NOT NULL,
	"opening_balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "account_id" integer;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_account_idx" ON "expenses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "incomes_account_idx" ON "incomes" USING btree ("account_id");