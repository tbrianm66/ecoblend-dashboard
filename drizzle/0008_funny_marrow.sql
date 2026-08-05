ALTER TABLE "vrl_assessments" ADD COLUMN "submitted_by_id" varchar(128);--> statement-breakpoint
ALTER TABLE "vrl_assessments" ADD COLUMN "submitted_evidence_links" json;