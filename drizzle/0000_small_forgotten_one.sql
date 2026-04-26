CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "expense_line" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"due_day" smallint NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	"reserve_amortization_cents" integer DEFAULT 0 NOT NULL,
	"opening_balance_cents" integer,
	"yield_rate_bp" integer DEFAULT 100 NOT NULL,
	"notes" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_entry" (
	"id" serial PRIMARY KEY NOT NULL,
	"line_id" integer NOT NULL,
	"year" integer NOT NULL,
	"month" smallint NOT NULL,
	"projected_cents" integer DEFAULT 0 NOT NULL,
	"actual_cents" integer,
	"paid_at" timestamp with time zone,
	"notes" text,
	"updated_by_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_entry" ADD CONSTRAINT "monthly_entry_line_id_expense_line_id_fk" FOREIGN KEY ("line_id") REFERENCES "public"."expense_line"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_entry" ADD CONSTRAINT "monthly_entry_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_balance_year_month_idx" ON "monthly_balance" USING btree ("year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_entry_line_year_month_idx" ON "monthly_entry" USING btree ("line_id","year","month");