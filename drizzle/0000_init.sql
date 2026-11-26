CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"citations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answerable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"category" text NOT NULL,
	"requirement" text NOT NULL,
	"guidance" text NOT NULL,
	"mandatory" boolean NOT NULL,
	"priority" text NOT NULL,
	"pages" integer[] NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"window_start" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tender_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"mitigation" text NOT NULL,
	"pages" integer[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender_files" (
	"tender_id" uuid PRIMARY KEY NOT NULL,
	"data" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tender_pages" (
	"tender_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"text" text NOT NULL,
	CONSTRAINT "tender_pages_tender_id_page_number_pk" PRIMARY KEY("tender_id","page_number")
);
--> statement-breakpoint
CREATE TABLE "tenders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"issuer" text,
	"reference_number" text,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_hash" text NOT NULL,
	"page_count" integer NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"error_message" text,
	"submission_deadline" timestamp with time zone,
	"analysis" jsonb,
	"is_sample" boolean DEFAULT false NOT NULL,
	"analysis_started_at" timestamp with time zone,
	"analyzed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenders_file_hash_unique" UNIQUE("file_hash")
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risks" ADD CONSTRAINT "risks_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_files" ADD CONSTRAINT "tender_files_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tender_pages" ADD CONSTRAINT "tender_pages_tender_id_tenders_id_fk" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_tender_idx" ON "chat_messages" USING btree ("tender_id","created_at");--> statement-breakpoint
CREATE INDEX "checklist_items_tender_idx" ON "checklist_items" USING btree ("tender_id","position");--> statement-breakpoint
CREATE INDEX "risks_tender_idx" ON "risks" USING btree ("tender_id","position");--> statement-breakpoint
CREATE INDEX "tenders_created_at_idx" ON "tenders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tenders_deadline_idx" ON "tenders" USING btree ("submission_deadline");