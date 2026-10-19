CREATE TABLE "links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"original_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"click_count" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "links_slug_unique" UNIQUE("slug"),
	CONSTRAINT "links_click_count_valid" CHECK ("links"."click_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"title" varchar(200),
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"max_views" integer,
	"view_count" integer DEFAULT 0 NOT NULL,
	"is_burn_after_read" boolean DEFAULT false NOT NULL,
	CONSTRAINT "snippets_slug_unique" UNIQUE("slug"),
	CONSTRAINT "snippets_views_valid" CHECK ("snippets"."view_count" >= 0 AND ("snippets"."max_views" IS NULL OR ("snippets"."max_views" > 0 AND "snippets"."view_count" <= "snippets"."max_views")))
);
--> statement-breakpoint
CREATE INDEX "links_expiry_idx" ON "links" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "snippets_expiry_idx" ON "snippets" USING btree ("expires_at");