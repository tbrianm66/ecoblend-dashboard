CREATE TABLE `crmActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`contactId` varchar(36),
	`dealId` varchar(36),
	`leadId` varchar(36),
	`type` varchar(50) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text,
	`outcome` varchar(255),
	`dueAt` bigint,
	`completedAt` bigint,
	`status` varchar(50) DEFAULT 'pending',
	`assignedTo` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`company` varchar(255),
	`jobTitle` varchar(255),
	`email` varchar(255),
	`phone` varchar(50),
	`linkedinUrl` varchar(500),
	`contactType` varchar(50) DEFAULT 'prospect',
	`status` varchar(50) DEFAULT 'active',
	`source` varchar(100),
	`tags` text,
	`notes` text,
	`lastContactedAt` bigint,
	`nextFollowUpAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmDeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`pipelineId` varchar(36),
	`stageId` varchar(36),
	`contactId` varchar(36),
	`title` varchar(255) NOT NULL,
	`company` varchar(255),
	`value` int DEFAULT 0,
	`currency` varchar(10) DEFAULT 'GBP',
	`probability` int DEFAULT 0,
	`expectedCloseAt` bigint,
	`closedAt` bigint,
	`status` varchar(50) DEFAULT 'open',
	`lostReason` varchar(255),
	`assignedTo` varchar(100),
	`tags` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmDeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmLeads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`contactId` varchar(36),
	`title` varchar(255) NOT NULL,
	`company` varchar(255),
	`source` varchar(100),
	`status` varchar(50) DEFAULT 'new',
	`score` int DEFAULT 0,
	`estimatedValue` int DEFAULT 0,
	`assignedTo` varchar(100),
	`nextAction` varchar(255),
	`nextActionDate` bigint,
	`notes` text,
	`convertedDealId` varchar(36),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmLeads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmPipelineStages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pipelineId` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`probability` int DEFAULT 0,
	`color` varchar(20) DEFAULT '#6b7280',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crmPipelineStages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmPipelines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`name` varchar(255) NOT NULL,
	`description` text,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmPipelines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invCapTable` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`roundId` varchar(36),
	`shareholderName` varchar(255) NOT NULL,
	`shareholderType` varchar(50) DEFAULT 'founder',
	`shareClass` varchar(50) DEFAULT 'ordinary',
	`numberOfShares` int DEFAULT 0,
	`ownershipPercent` int DEFAULT 0,
	`pricePerShare` int DEFAULT 0,
	`investmentAmount` int DEFAULT 0,
	`vestingStart` bigint,
	`vestingCliff` int DEFAULT 0,
	`vestingPeriod` int DEFAULT 0,
	`fullyDiluted` boolean DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invCapTable_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36),
	`name` varchar(255) NOT NULL,
	`fund` varchar(255),
	`role` varchar(100),
	`investorType` varchar(50) DEFAULT 'vc',
	`email` varchar(255),
	`phone` varchar(50),
	`linkedinUrl` varchar(500),
	`websiteUrl` varchar(500),
	`portfolioFocus` text,
	`geographicFocus` varchar(255),
	`minChequeSize` int DEFAULT 0,
	`maxChequeSize` int DEFAULT 0,
	`preferredStage` varchar(100),
	`relationshipStatus` varchar(50) DEFAULT 'prospect',
	`warmIntro` boolean DEFAULT false,
	`introSource` varchar(255),
	`lastContactedAt` bigint,
	`nextFollowUpAt` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invDueDiligence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` varchar(36) NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`category` varchar(50) NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(50) DEFAULT 'pending',
	`priority` varchar(20) DEFAULT 'medium',
	`assignedTo` varchar(100),
	`documentUrl` varchar(1000),
	`dueAt` bigint,
	`completedAt` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invDueDiligence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invFundingRounds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`roundType` varchar(50) NOT NULL,
	`targetAmount` int DEFAULT 0,
	`raisedAmount` int DEFAULT 0,
	`preMoneyVal` int DEFAULT 0,
	`postMoneyVal` int DEFAULT 0,
	`equityOffered` int DEFAULT 0,
	`status` varchar(50) DEFAULT 'planning',
	`openedAt` bigint,
	`targetCloseAt` bigint,
	`closedAt` bigint,
	`leadInvestor` varchar(255),
	`useOfFunds` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invFundingRounds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invTermSheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roundId` varchar(36) NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`investorContactId` varchar(36),
	`investorName` varchar(255) NOT NULL,
	`investmentAmount` int DEFAULT 0,
	`preMoneyVal` int DEFAULT 0,
	`equityPercent` int DEFAULT 0,
	`instrumentType` varchar(50) DEFAULT 'equity',
	`liquidationPref` varchar(100),
	`antiDilution` varchar(100),
	`boardSeat` boolean DEFAULT false,
	`proRataRights` boolean DEFAULT false,
	`informationRights` boolean DEFAULT true,
	`dragAlong` boolean DEFAULT false,
	`tagAlong` boolean DEFAULT false,
	`vestingSchedule` varchar(255),
	`status` varchar(50) DEFAULT 'draft',
	`receivedAt` bigint,
	`expiresAt` bigint,
	`signedAt` bigint,
	`documentUrl` varchar(1000),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invTermSheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`roundId` varchar(36),
	`title` varchar(255) NOT NULL,
	`updateType` varchar(50) DEFAULT 'monthly',
	`content` text NOT NULL,
	`keyMetrics` text,
	`sentAt` bigint,
	`recipients` text,
	`status` varchar(50) DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invUpdates_id` PRIMARY KEY(`id`)
);
