ALTER TABLE "venture_scores" ADD COLUMN "humanReviewedBy" varchar(255);--> statement-breakpoint
ALTER TABLE "venture_scores" ADD COLUMN "humanReviewedAt" timestamp;--> statement-breakpoint
ALTER TABLE "venture_scores" ADD COLUMN "aiGenerated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ventures" ADD COLUMN "workflowStage" text;--> statement-breakpoint
ALTER TABLE "ventures" ADD COLUMN "pivotRequired" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ventures" ADD COLUMN "pivotReason" text;--> statement-breakpoint
ALTER TABLE "cc_stage_gate_reviews" ADD COLUMN "gateType" text;--> statement-breakpoint
ALTER TABLE "cc_stage_gate_reviews" ADD COLUMN "humanReviewRequired" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "cc_stage_gate_reviews" ADD COLUMN "humanReviewedBy" varchar(255);--> statement-breakpoint
ALTER TABLE "cc_stage_gate_reviews" ADD COLUMN "humanReviewedAt" timestamp;