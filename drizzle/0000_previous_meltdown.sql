CREATE TYPE "public"."carrier_status" AS ENUM('active', 'degraded', 'offline');--> statement-breakpoint
CREATE TYPE "public"."order_state" AS ENUM('created', 'assigned', 'in_transit', 'delayed', 'reassigned', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."order_priority" AS ENUM('standard', 'express', 'critical');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('north', 'west', 'south', 'east', 'central');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'customer', 'automated_system');--> statement-breakpoint
CREATE TABLE "app_user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_user_profiles_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "app_user_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "automation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"summary" text NOT NULL,
	"actions_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carriers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"status" "carrier_status" DEFAULT 'active' NOT NULL,
	"average_eta_hours" integer NOT NULL,
	"reliability_score" integer NOT NULL,
	"delay_bias_hours" integer DEFAULT 0 NOT NULL,
	"supported_regions" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carriers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_name" text NOT NULL,
	"actor_role" "user_role" NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"priority" "order_priority" DEFAULT 'standard' NOT NULL,
	"delivery_location" text NOT NULL,
	"region" "region" NOT NULL,
	"requested_delivery_at" timestamp with time zone NOT NULL,
	"expected_delivery_at" timestamp with time zone NOT NULL,
	"current_state" "order_state" DEFAULT 'created' NOT NULL,
	"assigned_warehouse_id" uuid,
	"assigned_carrier_id" uuid,
	"tracking_code" text NOT NULL,
	"delay_reason" text,
	"reassignment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"transit_started_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_tracking_code_unique" UNIQUE("tracking_code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"reorder_point" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "warehouse_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"available_units" integer NOT NULL,
	"reserved_units" integer DEFAULT 0 NOT NULL,
	"safety_stock" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"region" "region" NOT NULL,
	"handling_hours" integer NOT NULL,
	"capacity_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "warehouses_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "workflow_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"actor" "user_role" NOT NULL,
	"action" text NOT NULL,
	"summary" text NOT NULL,
	"from_state" "order_state",
	"to_state" "order_state",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_warehouse_id_warehouses_id_fk" FOREIGN KEY ("assigned_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_carrier_id_carriers_id_fk" FOREIGN KEY ("assigned_carrier_id") REFERENCES "public"."carriers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_inventory" ADD CONSTRAINT "warehouse_inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_user_profiles_role_idx" ON "app_user_profiles" USING btree ("role");--> statement-breakpoint
CREATE INDEX "automation_runs_created_idx" ON "automation_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "carriers_status_idx" ON "carriers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "carriers_reliability_idx" ON "carriers" USING btree ("reliability_score");--> statement-breakpoint
CREATE INDEX "orders_state_idx" ON "orders" USING btree ("current_state");--> statement-breakpoint
CREATE INDEX "orders_region_idx" ON "orders" USING btree ("region");--> statement-breakpoint
CREATE INDEX "orders_expected_eta_idx" ON "orders" USING btree ("expected_delivery_at");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "warehouse_inventory_unique_idx" ON "warehouse_inventory" USING btree ("warehouse_id","product_id");--> statement-breakpoint
CREATE INDEX "warehouse_inventory_available_idx" ON "warehouse_inventory" USING btree ("available_units");--> statement-breakpoint
CREATE INDEX "warehouses_region_idx" ON "warehouses" USING btree ("region");--> statement-breakpoint
CREATE INDEX "warehouses_city_idx" ON "warehouses" USING btree ("city");--> statement-breakpoint
CREATE INDEX "workflow_logs_order_idx" ON "workflow_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "workflow_logs_created_idx" ON "workflow_logs" USING btree ("created_at");