CREATE TABLE `burn_rate_metrics` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`monthlyBurnRate` decimal(12,2),
	`cashBalance` decimal(12,2),
	`monthlyRevenue` decimal(12,2),
	`netBurn` decimal(12,2),
	`runwayMonths` float,
	`previousRunwayMonths` float,
	`runwayTrend` enum('Improving','Stable','Declining') DEFAULT 'Stable',
	`alertStatus` enum('Green','Amber','Red') DEFAULT 'Green',
	`reportingPeriod` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `burn_rate_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contingency_playbooks` (
	`id` varchar(64) NOT NULL,
	`riskType` varchar(128) NOT NULL,
	`triggerCondition` text,
	`recommendedResponse` text,
	`linkedPlaybook` varchar(255),
	`responsibleRole` varchar(128),
	`escalationPath` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contingency_playbooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_validation_evidence` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`customerSegment` varchar(255),
	`interviewCount` int DEFAULT 0,
	`validatedProblem` boolean DEFAULT false,
	`painIntensityScore` int,
	`willingnessToPayScore` int,
	`evidenceQualityScore` int,
	`problemSolutionFitScore` int,
	`evidenceSource` varchar(255),
	`dateCollected` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_validation_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_velocity_metrics` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`sprintName` varchar(255),
	`plannedMilestones` int DEFAULT 0,
	`completedMilestones` int DEFAULT 0,
	`overdueMilestones` int DEFAULT 0,
	`velocityScore` int,
	`deliveryConfidenceScore` int,
	`stageGateSlippageDays` int DEFAULT 0,
	`riskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execution_velocity_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `failure_risk_alerts` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`alertType` varchar(128),
	`alertSeverity` enum('Amber','Red') DEFAULT 'Amber',
	`alertMessage` text,
	`linkedModule` varchar(128),
	`recommendedAction` text,
	`status` enum('Active','Resolved','Dismissed') DEFAULT 'Active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `failure_risk_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flexibility_pivot_logs` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`pivotEvent` varchar(255),
	`pivotReason` text,
	`evidenceBasedBoolean` boolean DEFAULT false,
	`recommendationsOverridden` int DEFAULT 0,
	`playbookDismissals` int DEFAULT 0,
	`dismissalReason` varchar(255),
	`adaptabilityScore` int,
	`flexibilityRiskScore` int,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flexibility_pivot_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funding_progression_metrics` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`currentFundingStage` varchar(64),
	`capitalRequired` decimal(12,2),
	`capitalSecured` decimal(12,2),
	`fundingGap` decimal(12,2),
	`monthsToNextRaise` int,
	`investorReadinessScore` int,
	`pitchDeckReadyBoolean` boolean DEFAULT false,
	`businessPlanReadyBoolean` boolean DEFAULT false,
	`dataRoomReadyBoolean` boolean DEFAULT false,
	`fundingRiskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funding_progression_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `market_timing_signals` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`marketGrowthScore` int,
	`competitorActivityScore` int,
	`regulatoryRiskScore` int,
	`adoptionReadinessScore` int,
	`externalShockRiskScore` int,
	`marketSignalSource` varchar(255),
	`marketTimingRiskScore` int,
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_timing_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_model_assessments` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`revenueModelType` varchar(128),
	`pricingValidated` boolean DEFAULT false,
	`grossMarginAssumption` int,
	`unitEconomicsScore` int,
	`repeatabilityScore` int,
	`scalabilityScore` int,
	`revenueConfidenceScore` int,
	`riskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_model_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `startup_failure_risk_scores` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`overallFailureRiskScore` int DEFAULT 0,
	`cashRunwayRisk` int DEFAULT 0,
	`customerValidationRisk` int DEFAULT 0,
	`revenueModelRisk` int DEFAULT 0,
	`executionVelocityRisk` int DEFAULT 0,
	`teamCompetencyRisk` int DEFAULT 0,
	`flexibilityRisk` int DEFAULT 0,
	`fundingProgressionRisk` int DEFAULT 0,
	`marketTimingRisk` int DEFAULT 0,
	`strategicRoadmapRisk` int DEFAULT 0,
	`riskBand` enum('Green','Amber','Red') DEFAULT 'Green',
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `startup_failure_risk_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `strategic_roadmap_assessments` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`roadmapExistsBoolean` boolean DEFAULT false,
	`milestoneQualityScore` int,
	`dependencyRiskScore` int,
	`stageGateClarityScore` int,
	`executionPlanCompletenessScore` int,
	`roadmapRiskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategic_roadmap_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_competency_assessments` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`founderCapabilityScore` int,
	`technicalExpertiseScore` int,
	`commercialExpertiseScore` int,
	`financialExpertiseScore` int,
	`leadershipScore` int,
	`domainExpertiseScore` int,
	`missingRoles` text,
	`aggregateTeamScore` int,
	`competencyRiskScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_competency_assessments_id` PRIMARY KEY(`id`)
);
