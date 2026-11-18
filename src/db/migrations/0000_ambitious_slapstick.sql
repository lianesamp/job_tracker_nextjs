CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"job_url" text,
	"city" text,
	"work_mode" text NOT NULL,
	"salary" text,
	"status" text DEFAULT 'saved' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;