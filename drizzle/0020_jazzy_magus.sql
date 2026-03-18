CREATE TABLE `contribution_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`allocationId` int NOT NULL,
	`memberName` varchar(128) NOT NULL,
	`contributionType` enum('Task Completion','Milestone Achieved','Capital Injection','Commercial Traction','VRL Progression','IP Filing','Team Building','Other') NOT NULL,
	`description` text,
	`valueScore` float NOT NULL DEFAULT 0,
	`capitalAmount` float DEFAULT 0,
	`evidenceUrl` varchar(512),
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contribution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equity_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`memberName` varchar(128) NOT NULL,
	`memberRole` enum('Founder','Co-Founder','Lead Engineer','VBS Mentor','Advisor','Operator','Investor') DEFAULT 'Founder',
	`equityPct` float NOT NULL DEFAULT 0,
	`vestingMonths` int DEFAULT 48,
	`cliffMonths` int DEFAULT 12,
	`monthsIn` int DEFAULT 0,
	`vestingStatus` enum('Not Started','Cliff','Vesting','Fully Vested') DEFAULT 'Not Started',
	`vrlScore` float DEFAULT 0,
	`contributionScore` float DEFAULT 0,
	`capitalInput` float DEFAULT 0,
	`performanceScore` float DEFAULT 0,
	`dynamicEquityScore` float DEFAULT 0,
	`dynamicEquityPct` float DEFAULT 0,
	`stipendStatus` enum('Active','Completed','Pending','Paused') DEFAULT 'Pending',
	`stipendMonthly` float DEFAULT 0,
	`stipendMonthsTotal` int DEFAULT 6,
	`stipendMonthsUsed` int DEFAULT 0,
	`legallyConverted` boolean DEFAULT false,
	`conversionDate` timestamp,
	`shareClass` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equity_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equity_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`milestoneName` varchar(128) NOT NULL,
	`milestoneType` enum('VRL Gate','Pre-Seed Funding','Seed Funding','Series A','Revenue Target','Custom') NOT NULL,
	`triggerVrlLevel` int,
	`triggerRevenueGbp` float,
	`description` text,
	`status` enum('Pending','Active','Triggered','Completed') DEFAULT 'Pending',
	`triggeredAt` timestamp,
	`legalStructure` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equity_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `equity_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`vrlWeight` float NOT NULL DEFAULT 0.4,
	`contributionWeight` float NOT NULL DEFAULT 0.3,
	`capitalWeight` float NOT NULL DEFAULT 0.2,
	`performanceWeight` float NOT NULL DEFAULT 0.1,
	`totalEquityPool` float NOT NULL DEFAULT 20,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `equity_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `equity_rules_ventureId_unique` UNIQUE(`ventureId`)
);
--> statement-breakpoint
CREATE TABLE `venture_cap_table_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	`triggerEvent` varchar(128),
	`capTableJson` text NOT NULL,
	`totalEquityAllocated` float DEFAULT 0,
	`totalDynamicScore` float DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `venture_cap_table_snapshots_id` PRIMARY KEY(`id`)
);
