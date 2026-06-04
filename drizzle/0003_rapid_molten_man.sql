CREATE TABLE "venture_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"userId" integer NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venture_members_venture_user_unique" UNIQUE("ventureId","userId")
);
--> statement-breakpoint
ALTER TABLE "venture_members" ADD CONSTRAINT "venture_members_ventureId_ventures_id_fk" FOREIGN KEY ("ventureId") REFERENCES "public"."ventures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venture_members" ADD CONSTRAINT "venture_members_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;