CREATE TABLE "allowed_email" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"invited_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allowed_email_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "allowed_email" ADD CONSTRAINT "allowed_email_invited_by_id_user_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;