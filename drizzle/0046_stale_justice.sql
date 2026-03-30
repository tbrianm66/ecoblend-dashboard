CREATE TABLE `pb_kpi_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`runId` int,
	`kpiLabel` varchar(300) NOT NULL,
	`targetValue` varchar(100),
	`actualValue` varchar(100),
	`unit` varchar(50),
	`achieved` boolean,
	`measuredAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pb_kpi_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pb_linked_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`assetName` varchar(200) NOT NULL,
	`pbAssetType` enum('data_asset','venture','document','system','api') NOT NULL,
	`assetRef` varchar(500),
	`domain` varchar(100),
	`pbClassification` enum('PII','Confidential','Internal','Public'),
	`pbZone` enum('Bronze','Silver','Gold','Platinum'),
	`dqsCurrent` decimal(5,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pb_linked_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pb_playbooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` varchar(20) NOT NULL,
	`title` varchar(200) NOT NULL,
	`subFolder` enum('avoid_catch22','democratize_quality','embed_operations','adapt_ai_genai','scale_governance') NOT NULL,
	`version` varchar(20) NOT NULL DEFAULT '1.0.0',
	`ownerRole` varchar(100),
	`strategicPrinciple` text,
	`triggerConditions` text,
	`kpis` text,
	`pbStatus` enum('draft','active','deprecated') NOT NULL DEFAULT 'draft',
	`lastRun` timestamp,
	`runCount` int NOT NULL DEFAULT 0,
	`linkedAssetIds` text,
	`ventureId` varchar(100),
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pb_playbooks_id` PRIMARY KEY(`id`),
	CONSTRAINT `pb_playbooks_playbookId_unique` UNIQUE(`playbookId`)
);
--> statement-breakpoint
CREATE TABLE `pb_run_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`stepId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`pbRunStepStatus` enum('pending','in_progress','completed','skipped','blocked') NOT NULL DEFAULT 'pending',
	`assignedTo` varchar(255),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`evidence` text,
	`blockerReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pb_run_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pb_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`ventureId` varchar(100),
	`triggeredBy` varchar(255),
	`triggerReason` varchar(500),
	`pbRunStatus` enum('pending','in_progress','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 1,
	`totalSteps` int NOT NULL DEFAULT 0,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`notes` text,
	`aiSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pb_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pb_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`action` text NOT NULL,
	`assigneeRole` varchar(100),
	`slaDays` int,
	`toolsRequired` text,
	`outputArtifact` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pb_steps_id` PRIMARY KEY(`id`)
);
