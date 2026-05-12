CREATE TYPE "public"."method" AS ENUM('gamepass', 'community');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('waiting_payment', 'paid', 'processing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."web_role" AS ENUM('superadmin', 'viewer');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" varchar NOT NULL,
	"discord_user_id" varchar NOT NULL,
	"added_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_guild_id_discord_user_id_unique" UNIQUE("guild_id","discord_user_id")
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"setup_done" boolean DEFAULT false NOT NULL,
	"admin_role_id" varchar,
	"robux_rate" numeric(10, 2),
	"tax_percent" numeric(5, 2) DEFAULT '30' NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"status_message" varchar,
	"category_id" varchar,
	"ch_commands" varchar,
	"ch_logs" varchar,
	"ch_announce" varchar,
	"ch_order" varchar,
	"ch_buy" varchar,
	"pending_cat_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" uuid NOT NULL,
	"action" varchar NOT NULL,
	"actor" varchar,
	"note" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guild_id" varchar NOT NULL,
	"order_number" varchar NOT NULL,
	"buyer_id" varchar NOT NULL,
	"buyer_username" varchar NOT NULL,
	"method" "method" NOT NULL,
	"robux_amount" integer NOT NULL,
	"robux_gross" integer NOT NULL,
	"gamepass_link" varchar,
	"roblox_username" varchar,
	"price_idr" integer NOT NULL,
	"payment_method" varchar NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"order_status" "order_status" DEFAULT 'waiting_payment' NOT NULL,
	"midtrans_order_id" varchar,
	"midtrans_snap_token" varchar,
	"pending_channel_id" varchar,
	"order_channel_msg_id" varchar,
	"processed_by" varchar,
	"notes" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_midtrans_order_id_unique" UNIQUE("midtrans_order_id")
);
--> statement-breakpoint
CREATE TABLE "web_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"name" varchar NOT NULL,
	"role" "web_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "web_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_logs" ADD CONSTRAINT "order_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE no action ON UPDATE no action;