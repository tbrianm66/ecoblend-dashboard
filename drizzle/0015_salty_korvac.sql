CREATE TABLE `co_founder_compatibility` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentProfileIdA` int NOT NULL,
	`talentProfileIdB` int NOT NULL,
	`productOpportunityId` int,
	`capabilityComplementScore` int DEFAULT 0,
	`valueAlignmentScore` int DEFAULT 0,
	`workingStyleScore` int DEFAULT 0,
	`networkComplementScore` int DEFAULT 0,
	`overallCompatibilityScore` int DEFAULT 0,
	`compatibilityRationale` text,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `co_founder_compatibility_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `founder_match_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`talentProfileId` int NOT NULL,
	`productOpportunityId` int NOT NULL,
	`sectorAlignmentScore` int DEFAULT 0,
	`capabilityFitScore` int DEFAULT 0,
	`availabilityScore` int DEFAULT 0,
	`pvfScore` int DEFAULT 0,
	`experienceScore` int DEFAULT 0,
	`networkScore` int DEFAULT 0,
	`overallMatchScore` int DEFAULT 0,
	`recommendedRole` varchar(128),
	`matchRationale` text,
	`status` enum('Suggested','Reviewed','Accepted','Declined','Converted') DEFAULT 'Suggested',
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founder_match_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spinoff_configurations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`founderProfileIds` text NOT NULL,
	`proposedVentureName` varchar(128),
	`proposedTagline` text,
	`proposedSector` varchar(128),
	`proposedChannel` enum('B2B','D2C','B2B2C') DEFAULT 'B2B',
	`proposedBrandColor` varchar(32) DEFAULT '#22c55e',
	`strategicClassification` enum('Sustaining','Disruptive-NewMarket','Disruptive-LowEnd') DEFAULT 'Sustaining',
	`engineOfGrowth` enum('Sticky','Viral','Paid'),
	`estimatedBurnRateMonthly` int DEFAULT 0,
	`estimatedRunwayMonths` int DEFAULT 12,
	`fundingAskAmount` int DEFAULT 0,
	`nominatedCharity` varchar(255),
	`assignedMentor` varchar(128),
	`vbsSupportLevel` enum('Full Incubation','Accelerator','Advisory Only') DEFAULT 'Full Incubation',
	`status` enum('Draft','Under Review','Approved','Rejected','Launched') DEFAULT 'Draft',
	`convertedToVentureId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spinoff_configurations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spinoff_execution_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spinoffConfigId` int NOT NULL,
	`planVersion` int DEFAULT 1,
	`planTitle` varchar(255),
	`executiveSummary` text,
	`fullPlanMarkdown` text,
	`milestonesJson` text,
	`resourceAllocationJson` text,
	`risksJson` text,
	`kpiFrameworkJson` text,
	`generatedBy` varchar(64) DEFAULT 'llm',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedBy` varchar(128),
	`reviewedAt` timestamp,
	`status` enum('Draft','Under Review','Approved','Superseded') DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `spinoff_execution_plans_id` PRIMARY KEY(`id`)
);
