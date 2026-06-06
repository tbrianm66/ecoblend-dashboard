CREATE TABLE "governance_structures" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"founderVetoRights" boolean DEFAULT false,
	"founderVetoScope" text,
	"boardSize" integer,
	"founderSeats" integer,
	"independentSeats" integer,
	"investorSeats" integer,
	"missionAlignedSeats" integer,
	"employeeRepresentation" boolean DEFAULT false,
	"communityRepresentation" boolean DEFAULT false,
	"customerAdvisoryBoard" boolean DEFAULT false,
	"missionClauseInBylaws" boolean DEFAULT false,
	"missionClauseText" text,
	"complianceScore" integer,
	"lastReviewAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_drift_alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"alertType" text NOT NULL,
	"severity" text DEFAULT 'Medium',
	"description" text,
	"evidence" text,
	"recommendedAction" text,
	"status" text DEFAULT 'Active',
	"acknowledgedAt" timestamp,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mission_integrity_scores" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"overallScore" integer NOT NULL,
	"financialVsMissionDrift" integer NOT NULL,
	"stakeholderAlignmentScore" integer NOT NULL,
	"governanceStrengthScore" integer NOT NULL,
	"leadershipContinuityScore" integer NOT NULL,
	"missionDriftTrend" text DEFAULT 'Stable',
	"lastAssessmentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholder_profiles" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"stakeholderType" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(128),
	"primaryIncentive" varchar(255),
	"missionAlignment" integer,
	"financialAlignment" integer,
	"lastEngagementAt" timestamp,
	"feedbackScore" integer,
	"conflictRisk" text DEFAULT 'Low',
	"conflictDescription" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "succession_plans" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"currentCeo" varchar(255),
	"ceoPlanningHorizon" integer,
	"potentialSuccessors" json,
	"founderIntentDocumented" boolean DEFAULT false,
	"founderIntentSummary" text,
	"institutionalMemorySystem" boolean DEFAULT false,
	"missionCodexDocument" text,
	"keyDecisionFrameworks" json,
	"coreValuesDocumented" json,
	"successionReadinessScore" integer,
	"riskFactors" json,
	"lastUpdatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
