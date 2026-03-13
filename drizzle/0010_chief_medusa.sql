CREATE TABLE `autonomy_health_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`assessmentDate` timestamp NOT NULL,
	`budgetProtectionScore` int DEFAULT 0,
	`decisionAutonomyScore` int DEFAULT 0,
	`metricsAppropriatenessScore` int DEFAULT 0,
	`valueNetworkEmbeddingScore` int DEFAULT 0,
	`totalAutonomyScore` int DEFAULT 0,
	`autonomyLevel` enum('Critical','Low','Moderate','High') DEFAULT 'Critical',
	`budgetNotes` text,
	`decisionNotes` text,
	`metricsNotes` text,
	`valueNetworkNotes` text,
	`recommendedActions` text,
	`assessedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autonomy_health_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cohort_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`foundingCohort` varchar(8) NOT NULL,
	`snapshotQuarter` varchar(8) NOT NULL,
	`quartersElapsed` int NOT NULL,
	`vrlScore` float,
	`trlLevel` int,
	`experimentPassRate` float,
	`pivotCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cohort_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `onboarding_hypotheses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`onboardingStep` int NOT NULL,
	`taskLabel` varchar(255) NOT NULL,
	`hypothesis` text NOT NULL,
	`validationCriterion` text NOT NULL,
	`minimumSampleSize` int,
	`outcome` enum('Validated','Invalidated','Inconclusive','Pending') DEFAULT 'Pending',
	`evidenceSummary` text,
	`validatedAt` timestamp,
	`linkedExperimentIds` text,
	`linkedInterviewIds` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `onboarding_hypotheses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_disruption_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`initialMarketSmallness` int DEFAULT 0,
	`nonConsumerTargeting` int DEFAULT 0,
	`simplicityScore` int DEFAULT 0,
	`lowMarginViability` int DEFAULT 0,
	`incumbentIgnoreScore` int DEFAULT 0,
	`disruptionPotentialScore` int DEFAULT 0,
	`requiresDifferentCostStructure` boolean DEFAULT false,
	`requiresDifferentChannel` boolean DEFAULT false,
	`requiresDifferentCustomerRelationship` boolean DEFAULT false,
	`autonomousTeamFlagged` boolean DEFAULT false,
	`assessmentNotes` text,
	`assessedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunity_disruption_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `opportunity_disruption_scores_opportunityId_unique` UNIQUE(`opportunityId`)
);
--> statement-breakpoint
CREATE TABLE `pivot_decisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`decisionDate` timestamp NOT NULL,
	`decision` enum('Pivot','Persevere','Pause') NOT NULL,
	`pivotType` enum('Zoom-In','Zoom-Out','Customer-Segment','Customer-Need','Platform','Business-Architecture','Value-Capture','Engine-of-Growth','Channel','Technology'),
	`hypothesisTested` text NOT NULL,
	`evidenceSummary` text,
	`experimentsPassed` int DEFAULT 0,
	`experimentsFailed` int DEFAULT 0,
	`interviewsReviewed` int DEFAULT 0,
	`vrlScoreAtDecision` float,
	`newHypothesis` text,
	`rationale` text,
	`decidedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pivot_decisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pivot_runway_inputs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`currentCashBalance` int DEFAULT 0,
	`monthlyBurnRate` int DEFAULT 0,
	`avgPivotCostEstimate` int DEFAULT 0,
	`avgPivotDurationWeeks` int DEFAULT 8,
	`estimatedRunwayMonths` float,
	`estimatedPivotsRemaining` float,
	`runwayAlertThreshold` int DEFAULT 2,
	`runwayAlertActive` boolean DEFAULT false,
	`lastCalculatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pivot_runway_inputs_id` PRIMARY KEY(`id`),
	CONSTRAINT `pivot_runway_inputs_ventureId_unique` UNIQUE(`ventureId`)
);
--> statement-breakpoint
CREATE TABLE `pivot_trigger_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`minExperimentPassRatePct` float DEFAULT 30,
	`maxRiskIndexPct` float DEFAULT 60,
	`minVrlScore` float DEFAULT 2,
	`stagnationPeriodDays` int DEFAULT 60,
	`alertActive` boolean DEFAULT false,
	`alertTriggeredAt` timestamp,
	`alertDismissedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pivot_trigger_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `pivot_trigger_config_ventureId_unique` UNIQUE(`ventureId`)
);
--> statement-breakpoint
CREATE TABLE `technology_trajectories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`mainStreamMarketTrlThreshold` int DEFAULT 7,
	`lowEndMarketTrlThreshold` int DEFAULT 4,
	`currentTrl` int NOT NULL,
	`trlGrowthRatePerQuarter` float,
	`quartersToMainstreamEntry` float,
	`quartersToLowEndEntry` float,
	`alertHorizonQuarters` int DEFAULT 4,
	`marketEntryAlertActive` boolean DEFAULT false,
	`snapshotDate` timestamp NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technology_trajectories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `value_networks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`primaryCustomerSegment` text,
	`customerPerformanceMetrics` text,
	`targetGrossMarginPct` float,
	`costStructureNotes` text,
	`primaryChannel` varchar(128),
	`channelNotes` text,
	`competitiveAlternatives` text,
	`requiresDifferentCostStructure` boolean DEFAULT false,
	`requiresDifferentChannel` boolean DEFAULT false,
	`requiresDifferentCustomerRelationship` boolean DEFAULT false,
	`autonomousTeamRecommended` boolean DEFAULT false,
	`autonomousTeamNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `value_networks_id` PRIMARY KEY(`id`),
	CONSTRAINT `value_networks_ventureId_unique` UNIQUE(`ventureId`)
);
--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `churnRate` float;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `retentionRate` float;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `viralCoefficient` float;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `referralRate` float;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `customerAcquisitionCost` int;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `customerLifetimeValue` int;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `ltvCacRatio` float;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `baselineRevenueTarget` int;--> statement-breakpoint
ALTER TABLE `financial_snapshots` ADD `isBaseline` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `ventures` ADD `strategicClassification` enum('Sustaining','Disruptive-NewMarket','Disruptive-LowEnd') DEFAULT 'Sustaining';--> statement-breakpoint
ALTER TABLE `ventures` ADD `engineOfGrowth` enum('Sticky','Viral','Paid');--> statement-breakpoint
ALTER TABLE `ventures` ADD `productMarketFitSignal` enum('Not Yet','Emerging','Achieved') DEFAULT 'Not Yet';--> statement-breakpoint
ALTER TABLE `ventures` ADD `experimentPassRate` float;--> statement-breakpoint
ALTER TABLE `ventures` ADD `learningVelocity` int;--> statement-breakpoint
ALTER TABLE `ventures` ADD `interviewInsightRate` float;