CREATE TABLE `uniDataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`sourceType` varchar(64) NOT NULL DEFAULT 'interview',
	`title` varchar(255) NOT NULL,
	`description` text,
	`sampleSize` int,
	`collectionMethod` varchar(255),
	`status` varchar(32) NOT NULL DEFAULT 'planned',
	`dataUrl` varchar(512),
	`keyInsights` text,
	`aiAnalysisDone` boolean DEFAULT false,
	`aiSummary` text,
	`linkedHypothesis` varchar(255),
	`collectedAt` bigint,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniDataSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniGovernanceDocs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`docType` varchar(64) NOT NULL DEFAULT 'student_agreement',
	`title` varchar(255) NOT NULL,
	`parties` text,
	`status` varchar(32) NOT NULL DEFAULT 'draft',
	`signedDate` bigint,
	`expiryDate` bigint,
	`documentUrl` varchar(512),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniGovernanceDocs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniIndustryEngagements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`engagementType` varchar(64) NOT NULL DEFAULT 'sponsored_research',
	`description` text,
	`contactName` varchar(255),
	`contactEmail` varchar(255),
	`value` decimal(12,2),
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`startDate` bigint,
	`endDate` bigint,
	`deliverables` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniIndustryEngagements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniPartners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(64) NOT NULL DEFAULT 'university',
	`country` varchar(100),
	`department` varchar(255),
	`contactName` varchar(255),
	`contactEmail` varchar(255),
	`partnershipType` varchar(64) NOT NULL DEFAULT 'research',
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`startDate` bigint,
	`endDate` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniPartners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniResearchProjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`partnerId` int,
	`title` varchar(255) NOT NULL,
	`researchType` varchar(64) NOT NULL DEFAULT 'business',
	`description` text,
	`objective` text,
	`methodology` varchar(128),
	`status` varchar(32) NOT NULL DEFAULT 'planned',
	`leadResearcher` varchar(255),
	`startDate` bigint,
	`endDate` bigint,
	`budget` decimal(12,2),
	`publicationUrl` varchar(512),
	`keyFindings` text,
	`trlImpact` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniResearchProjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniRoadmapMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`phase` varchar(32) NOT NULL DEFAULT 'setup',
	`title` varchar(255) NOT NULL,
	`description` text,
	`owner` varchar(255),
	`targetDate` bigint,
	`completedDate` bigint,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`priority` varchar(16) NOT NULL DEFAULT 'medium',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniRoadmapMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniTalentRoles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`partnerId` int,
	`name` varchar(255) NOT NULL,
	`roleType` varchar(64) NOT NULL DEFAULT 'student',
	`institution` varchar(255),
	`skills` text,
	`availability` varchar(64) DEFAULT 'part_time',
	`assignedProject` varchar(255),
	`stipend` decimal(10,2),
	`startDate` bigint,
	`endDate` bigint,
	`status` varchar(32) NOT NULL DEFAULT 'active',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniTalentRoles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uniVentureWorkflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`stage` varchar(64) NOT NULL DEFAULT 'problem_definition',
	`problemStatement` text,
	`researchFindings` text,
	`hypothesis` text,
	`validationMethod` varchar(255),
	`validationResult` varchar(64),
	`commercialisationPlan` text,
	`linkedResearchId` int,
	`stageGatePassed` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `uniVentureWorkflows_id` PRIMARY KEY(`id`)
);
