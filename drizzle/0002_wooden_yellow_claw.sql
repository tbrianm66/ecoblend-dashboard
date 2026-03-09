CREATE TABLE `experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`hypothesis` text,
	`method` text,
	`result` text,
	`outcome` enum('Pass','Fail','Inconclusive','Pending') DEFAULT 'Pending',
	`trlLevelJustified` int,
	`conductedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financial_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`revenueActual` int DEFAULT 0,
	`revenueTarget` int DEFAULT 0,
	`monthlyBurn` int DEFAULT 0,
	`cashRunway` int DEFAULT 0,
	`investmentRaised` int DEFAULT 0,
	`investmentTarget` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `founders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`role` varchar(128),
	`background` text,
	`domainExpertiseScore` int DEFAULT 0,
	`experienceScore` int DEFAULT 0,
	`commitmentScore` int DEFAULT 0,
	`equityPct` float DEFAULT 0,
	`esopAllocated` boolean DEFAULT false,
	`linkedIn` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`intervieweeName` varchar(128),
	`intervieweeRole` varchar(128),
	`intervieweeOrg` varchar(128),
	`date` varchar(32),
	`channel` enum('In-Person','Video','Phone','Survey') DEFAULT 'Video',
	`keyInsights` text,
	`painPoints` text,
	`validationSignals` text,
	`aiSummary` text,
	`rawTranscript` text,
	`vrlStageRelevant` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`completed` boolean DEFAULT false,
	`targetDate` varchar(32),
	`completedAt` timestamp,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`problemStatement` text,
	`sector` varchar(128),
	`marketSizeScore` int DEFAULT 0,
	`strategicFitScore` int DEFAULT 0,
	`esgAlignmentScore` int DEFAULT 0,
	`founderAvailScore` int DEFAULT 0,
	`totalScore` int DEFAULT 0,
	`status` enum('Identified','Scoring','Approved','Rejected','Converted') DEFAULT 'Identified',
	`convertedToVentureId` varchar(64),
	`submittedBy` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`domain` varchar(64) NOT NULL,
	`level` enum('Low','Medium','High') DEFAULT 'Medium',
	`mitigation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venture_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`vrl` int NOT NULL,
	`vrlPercent` int NOT NULL,
	`trl` int NOT NULL,
	`trlPercent` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `venture_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ventures` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`tagline` text,
	`sector` varchar(128),
	`channel` enum('B2B','D2C','B2B2C') DEFAULT 'B2B',
	`status` enum('Active','Pre-Launch','Scaling','Paused') DEFAULT 'Pre-Launch',
	`vrl` int NOT NULL DEFAULT 1,
	`vrlPercent` int DEFAULT 0,
	`trl` int NOT NULL DEFAULT 1,
	`trlPercent` int DEFAULT 0,
	`nominatedCharity` varchar(255),
	`charityFocus` text,
	`founder` varchar(255),
	`color` varchar(32) DEFAULT '#51AF37',
	`investmentReady` boolean DEFAULT false,
	`isInternalLab` boolean DEFAULT false,
	`description` text,
	`bmc` text,
	`mmc` text,
	`lifecycleStage` enum('Opportunity','Validation','Build','Launch','Scale') DEFAULT 'Opportunity',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ventures_id` PRIMARY KEY(`id`)
);
