CREATE TABLE `cost_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`manufacturingCostScore` int DEFAULT 1,
	`supplyChainCostScore` int DEFAULT 1,
	`lifecycleCostScore` int DEFAULT 1,
	`costScore` float DEFAULT 0,
	`currentCostEstimate` float,
	`targetCostEstimate` float,
	`costReductionOpportunity` text,
	`assessedBy` varchar(128),
	`assessedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dashboard_kpi_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` varchar(32) NOT NULL,
	`totalVentures` int DEFAULT 0,
	`activeVentures` int DEFAULT 0,
	`prelaunchVentures` int DEFAULT 0,
	`scalingVentures` int DEFAULT 0,
	`pausedVentures` int DEFAULT 0,
	`vrlStage1Count` int DEFAULT 0,
	`vrlStage2Count` int DEFAULT 0,
	`vrlStage3Count` int DEFAULT 0,
	`vrlStage4Count` int DEFAULT 0,
	`avgVrlScore` float DEFAULT 0,
	`investmentReadyCount` int DEFAULT 0,
	`activeProjects` int DEFAULT 0,
	`totalMilestonesThisMonth` int DEFAULT 0,
	`milestonesCompletedThisMonth` int DEFAULT 0,
	`overdueTasksCount` int DEFAULT 0,
	`opportunitiesIdentified` int DEFAULT 0,
	`opportunitiesScored` int DEFAULT 0,
	`opportunitiesApproved` int DEFAULT 0,
	`avgPosScore` float DEFAULT 0,
	`totalRevenueActual` int DEFAULT 0,
	`totalInvestmentRaised` int DEFAULT 0,
	`portfolioRoi` float DEFAULT 0,
	`avgIrlScore` float DEFAULT 0,
	`avgEsgScore` float DEFAULT 0,
	`certifiedVenturesCount` int DEFAULT 0,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dashboard_kpi_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ecosystem_map_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`posX` float DEFAULT 50,
	`posY` float DEFAULT 50,
	`nodeSize` int DEFAULT 40,
	`nodeColor` varchar(32),
	`linkedVentureIds` text,
	`linkType` enum('Technology Sharing','Market Overlap','Shared Founder','Supply Chain','Co-Investment','None') DEFAULT 'None',
	`displayLabel` varchar(64),
	`tooltipText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ecosystem_map_nodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `ecosystem_map_nodes_ventureId_unique` UNIQUE(`ventureId`)
);
--> statement-breakpoint
CREATE TABLE `execution_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`programId` int,
	`phaseId` int,
	`workstreamId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`riskCategory` enum('Schedule','Budget','Resource','Technical','Dependency','Regulatory','Stakeholder','Scope','Quality') DEFAULT 'Schedule',
	`likelihood` enum('Very Low','Low','Medium','High','Very High') DEFAULT 'Medium',
	`impact` enum('Negligible','Minor','Moderate','Major','Critical') DEFAULT 'Moderate',
	`riskScore` int DEFAULT 0,
	`riskLevel` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
	`mitigationPlan` text,
	`contingencyPlan` text,
	`owner` varchar(128),
	`status` enum('Open','Mitigated','Accepted','Closed','Escalated') DEFAULT 'Open',
	`reviewDate` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `execution_risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunity_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`reviewerName` varchar(128) NOT NULL,
	`reviewerRole` varchar(128),
	`decision` enum('Approve for VRL','Reject','Defer','Request More Data') NOT NULL,
	`rationale` text,
	`conditionsForApproval` text,
	`reviewedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opportunity_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`technicalCapabilityScore` int DEFAULT 1,
	`efficiencyScore` int DEFAULT 1,
	`functionalityScore` int DEFAULT 1,
	`performanceScore` float DEFAULT 0,
	`performanceGapDescription` text,
	`innovationOpportunity` text,
	`assessedBy` varchar(128),
	`assessedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `performance_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_baselines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`manufacturingCost` float,
	`supplyChainCost` float,
	`lifecycleCost` float,
	`technicalCapability` text,
	`efficiencyRating` float,
	`reliabilityScore` float,
	`durabilityYears` float,
	`carbonFootprintKg` float,
	`esgComplianceLevel` enum('None','Partial','Compliant','Certified') DEFAULT 'None',
	`circularityScore` float,
	`baselineSource` varchar(255),
	`baselineDate` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_baselines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`sector` varchar(128),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`categoryId` int,
	`sector` varchar(128),
	`targetMarket` varchar(255),
	`productStage` enum('Concept','Prototype','Pilot','Commercial','Mature') DEFAULT 'Concept',
	`status` enum('Identified','Under Assessment','Scored','Approved for VRL','Rejected','On Hold') DEFAULT 'Identified',
	`convertedToVentureId` varchar(64),
	`submittedBy` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_opportunity_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`costScore` float DEFAULT 0,
	`performanceScore` float DEFAULT 0,
	`qualityScore` float DEFAULT 0,
	`sustainabilityScore` float DEFAULT 0,
	`posScore` float DEFAULT 0,
	`posClassification` enum('Low Opportunity','Moderate Opportunity','High Opportunity','Exceptional Opportunity') DEFAULT 'Low Opportunity',
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_opportunity_scores_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_opportunity_scores_productOpportunityId_unique` UNIQUE(`productOpportunityId`)
);
--> statement-breakpoint
CREATE TABLE `quality_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`reliabilityScore` int DEFAULT 1,
	`durabilityScore` int DEFAULT 1,
	`userExperienceScore` int DEFAULT 1,
	`qualityScore` float DEFAULT 0,
	`qualityGapDescription` text,
	`improvementOpportunity` text,
	`assessedBy` varchar(128),
	`assessedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quality_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sustainability_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productOpportunityId` int NOT NULL,
	`carbonFootprintScore` int DEFAULT 1,
	`esgComplianceScore` int DEFAULT 1,
	`circularityScore` int DEFAULT 1,
	`sustainabilityScore` float DEFAULT 0,
	`sustainabilityGapDescription` text,
	`circularityOpportunity` text,
	`assessedBy` varchar(128),
	`assessedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sustainability_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`sourceType` enum('task','milestone','phase') NOT NULL,
	`sourceId` int NOT NULL,
	`targetType` enum('task','milestone','phase') NOT NULL,
	`targetId` int NOT NULL,
	`dependencyType` enum('Finish-to-Start','Start-to-Start','Finish-to-Finish','Start-to-Finish') DEFAULT 'Finish-to-Start',
	`lagDays` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venture_dependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`programId` int,
	`phaseId` int,
	`workstreamId` int,
	`taskId` int,
	`milestoneId` int,
	`title` varchar(255) NOT NULL,
	`documentType` enum('Brief','Report','Contract','Presentation','Spreadsheet','Design','Technical Spec','Research','Financial Model','Meeting Notes','Other') DEFAULT 'Other',
	`version` varchar(32) DEFAULT '1.0',
	`status` enum('Draft','Under Review','Approved','Superseded','Archived') DEFAULT 'Draft',
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(128),
	`fileSizeBytes` int DEFAULT 0,
	`uploadedBy` varchar(128),
	`approvedBy` varchar(128),
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workstreamId` int NOT NULL,
	`phaseId` int NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`milestoneType` enum('Gate Review','Deliverable','Decision Point','External Event','Funding Milestone','Launch') DEFAULT 'Deliverable',
	`status` enum('Not Started','In Progress','Completed','Overdue','Cancelled') DEFAULT 'Not Started',
	`targetDate` varchar(32),
	`completedAt` timestamp,
	`completionEvidence` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`programId` int NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`vrlStage` int,
	`phaseNumber` int NOT NULL,
	`status` enum('Not Started','In Progress','On Hold','Completed','Cancelled') DEFAULT 'Not Started',
	`startDate` varchar(32),
	`targetEndDate` varchar(32),
	`actualEndDate` varchar(32),
	`completionPercent` int DEFAULT 0,
	`gateReviewPassed` boolean DEFAULT false,
	`gateReviewDate` varchar(32),
	`gateReviewNotes` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_programs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('Not Started','In Progress','On Hold','Completed','Cancelled') DEFAULT 'Not Started',
	`startDate` varchar(32),
	`targetEndDate` varchar(32),
	`actualEndDate` varchar(32),
	`programManager` varchar(128),
	`budget` int DEFAULT 0,
	`budgetSpent` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_programs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`programId` int,
	`phaseId` int,
	`resourceType` enum('Person','Budget','Equipment','External Service') DEFAULT 'Person',
	`name` varchar(128) NOT NULL,
	`role` varchar(128),
	`allocationPercent` int DEFAULT 100,
	`allocationHoursPerWeek` float,
	`startDate` varchar(32),
	`endDate` varchar(32),
	`dayRate` int DEFAULT 0,
	`totalBudgeted` int DEFAULT 0,
	`totalActual` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workstreamId` int NOT NULL,
	`milestoneId` int,
	`ventureId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`kanbanStatus` enum('Backlog','To Do','In Progress','In Review','Done','Blocked') DEFAULT 'Backlog',
	`priority` enum('Critical','High','Medium','Low') DEFAULT 'Medium',
	`assignee` varchar(128),
	`startDate` varchar(32),
	`dueDate` varchar(32),
	`completedAt` timestamp,
	`estimatedHours` float DEFAULT 0,
	`actualHours` float DEFAULT 0,
	`dependsOnTaskIds` text,
	`sortOrder` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_workstreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` int NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`functionalArea` enum('Technical','Commercial','Legal','Financial','Marketing','Operations','People','ESG','Other') DEFAULT 'Other',
	`owner` varchar(128),
	`status` enum('Not Started','In Progress','On Hold','Completed') DEFAULT 'Not Started',
	`completionPercent` int DEFAULT 0,
	`startDate` varchar(32),
	`targetEndDate` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_workstreams_id` PRIMARY KEY(`id`)
);
