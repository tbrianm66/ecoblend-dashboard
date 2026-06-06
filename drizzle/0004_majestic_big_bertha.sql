CREATE TABLE "budget_validations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"wtpTestId" integer,
	"organisation" varchar(255),
	"budgetOwnerKnown" boolean DEFAULT false,
	"budgetOwnerRole" varchar(255),
	"budgetCategory" text,
	"budgetCycle" varchar(128),
	"currentBudgetAvailable" varchar(255),
	"estimatedBudgetRange" varchar(255),
	"approvalRequired" boolean DEFAULT false,
	"approvalStakeholders" text,
	"financialDecisionCriteria" text,
	"notes" text,
	"validationStatus" text DEFAULT 'unknown' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pricing_experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"hypothesisId" integer,
	"pricingModel" text DEFAULT 'subscription' NOT NULL,
	"pricePoint" varchar(255),
	"currency" varchar(8) DEFAULT 'GBP',
	"billingPeriod" varchar(32),
	"targetCustomerSegment" varchar(255),
	"valueMetric" text,
	"testMethod" text DEFAULT 'pricing_interview',
	"testSampleSize" integer DEFAULT 0,
	"positiveResponses" integer DEFAULT 0,
	"negativeResponses" integer DEFAULT 0,
	"conversionRate" integer DEFAULT 0,
	"learningSummary" text,
	"recommendedPriceRange" varchar(255),
	"recommendedNextTest" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "procurement_pathways" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"wtpTestId" integer,
	"organisation" varchar(255),
	"procurementRoute" text DEFAULT 'unknown' NOT NULL,
	"procurementComplexityScore" integer DEFAULT 1,
	"expectedSalesCycleDays" integer DEFAULT 0,
	"requiredDocuments" text,
	"complianceRequirements" text,
	"legalReviewRequired" boolean DEFAULT false,
	"dataSecurityReviewRequired" boolean DEFAULT false,
	"pilotPossibleWithoutFullProcurement" boolean DEFAULT false,
	"procurementRisks" text,
	"nextProcurementStep" text,
	"status" text DEFAULT 'unknown' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wtp_commitments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"wtpTestId" integer,
	"commitmentType" text DEFAULT 'verbal_interest' NOT NULL,
	"commitmentDescription" text,
	"commitmentValue" varchar(255),
	"commitmentCurrency" varchar(8) DEFAULT 'GBP',
	"commitmentDate" varchar(32),
	"evidenceReference" text,
	"status" text DEFAULT 'weak' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "customerSegmentId" integer;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "organisation" varchar(255);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "contactRole" varchar(255);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "economicBuyer" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "budgetOwnerStatus" text DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "budgetOwnerName" varchar(255);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "budgetOwnerRole" varchar(255);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "currentSpendCurrency" varchar(8) DEFAULT 'GBP';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "currentSpendPeriod" varchar(32);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "priceCurrency" varchar(8) DEFAULT 'GBP';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "pricePeriod" varchar(32);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "testMethod" text DEFAULT 'pricing_interview';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "evidenceStrengthScore" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "pricingResponse" text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "procurementPathwayStatus" text DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "procurementPathwayNotes" text;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "decisionProcessNotes" text;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "objectionCategory" text;--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "nextActionDueDate" varchar(32);--> statement-breakpoint
ALTER TABLE "wtp_tests" ADD COLUMN "status" text DEFAULT 'planned';