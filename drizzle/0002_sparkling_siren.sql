CREATE TABLE "expense_line_value" (
	"id" serial PRIMARY KEY NOT NULL,
	"line_id" integer NOT NULL,
	"effective_year" integer NOT NULL,
	"effective_month" smallint NOT NULL,
	"projected_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense_line" ADD COLUMN "default_paid_with_card" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_entry" ADD COLUMN "paid_with_card" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_line_value" ADD CONSTRAINT "expense_line_value_line_id_expense_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."expense_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "expense_line_value_line_year_month_idx" ON "expense_line_value" USING btree ("line_id","effective_year","effective_month");