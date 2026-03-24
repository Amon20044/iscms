ALTER TYPE "public"."user_role" ADD VALUE 'owner' BEFORE 'admin';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'org_admin' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_accounts_profile_id_unique" UNIQUE("profile_id")
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_session_token_hash_unique" UNIQUE("session_token_hash")
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_profile_id_app_user_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."app_user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_account_id_auth_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."auth_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_profile_idx" ON "auth_accounts" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "auth_accounts_active_idx" ON "auth_accounts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "auth_sessions_account_idx" ON "auth_sessions" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_expires_idx" ON "auth_sessions" USING btree ("expires_at");