ALTER TABLE "expense_line" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "expense_line" ADD COLUMN "default_projected_cents" integer DEFAULT 0 NOT NULL;