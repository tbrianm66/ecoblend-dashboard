CREATE TABLE `offeringAnalyticsLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`marketAnalysisId` int,
	`reportId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringAnalyticsLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringCrmLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`pipelineId` int,
	`dealId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringCrmLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringExperimentLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`experimentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringExperimentLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringFinancialModels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`modelName` varchar(128) NOT NULL DEFAULT 'Base Case',
	`revenueYear1` decimal(14,2),
	`revenueYear2` decimal(14,2),
	`revenueYear3` decimal(14,2),
	`cogsPercent` float,
	`opexMonthly` decimal(12,2),
	`breakEvenMonth` int,
	`fundingRequired` decimal(14,2),
	`assumptions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offeringFinancialModels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringKpiSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`snapshotDate` date NOT NULL,
	`revenue` decimal(14,2),
	`cogs` decimal(14,2),
	`grossMargin` float,
	`unitsSold` int,
	`activeCustomers` int,
	`cac` decimal(10,2),
	`ltv` decimal(10,2),
	`nps` int,
	`trlAtSnapshot` int,
	`brlAtSnapshot` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringKpiSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringMilestoneLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`milestoneId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringMilestoneLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringRevenueLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`snapshotId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringRevenueLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringRiskLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`riskId` int NOT NULL,
	`offeringRiskType` enum('venture','engineering','execution') DEFAULT 'venture',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringRiskLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringSupplyChainLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`projectId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringSupplyChainLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offeringWorkflowLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`offeringId` varchar(64) NOT NULL,
	`triggerLogId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offeringWorkflowLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` varchar(64) NOT NULL,
	`portfolioId` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`offeringType` enum('Physical Product','Digital Product','Service','SaaS','Subscription','Marketplace') DEFAULT 'Physical Product',
	`offeringStatus` enum('Concept','Development','Pilot','Live','Scaling','Sunset') DEFAULT 'Concept',
	`trl` int DEFAULT 1,
	`brlScore` int DEFAULT 0,
	`revenueModel` enum('B2B','D2C','B2B2C','Marketplace','Licensing','Freemium') DEFAULT 'B2B',
	`targetSegment` text,
	`pricePoint` decimal(12,2),
	`currency` varchar(8) DEFAULT 'GBP',
	`launchDate` date,
	`color` varchar(32) DEFAULT '#3A97D3',
	`logoUrl` text,
	`tags` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `offerings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolios` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`portfolioType` enum('Product','Service','Licensing','Platform','Mixed') DEFAULT 'Mixed',
	`portfolioStatus` enum('Active','Pre-Launch','Archived') DEFAULT 'Pre-Launch',
	`color` varchar(32) DEFAULT '#51AF37',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolios_id` PRIMARY KEY(`id`)
);
