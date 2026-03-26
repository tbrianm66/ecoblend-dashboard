CREATE TABLE `erl_agent_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stageId` int,
	`agentId` varchar(64) NOT NULL,
	`agentName` varchar(128) NOT NULL,
	`promptUsed` text,
	`inputContext` text,
	`outputJson` text,
	`tokensUsed` int,
	`durationMs` int,
	`erlAgentStatus` enum('queued','running','completed','failed','retrying') DEFAULT 'queued',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `erl_agent_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_ip_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`erlIpType` enum('patent','trade_secret','design_right','copyright','trademark','know_how') DEFAULT 'patent',
	`claimsJson` text,
	`technicalSummary` text,
	`noveltyStatement` text,
	`priorArtSearch` text,
	`draftClaims` text,
	`erlFilingStatus` enum('draft','review','filed','granted','rejected','abandoned') DEFAULT 'draft',
	`filingDate` timestamp,
	`grantDate` timestamp,
	`jurisdiction` varchar(128),
	`aiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_ip_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int,
	`name` varchar(256) NOT NULL,
	`erlMaterialCategory` enum('polymer','composite','metal','ceramic','bio_based','recycled','nano','hybrid') DEFAULT 'composite',
	`formulation` text,
	`sustainabilityScore` int DEFAULT 0,
	`recycledContent` int DEFAULT 0,
	`carbonFootprint` varchar(64),
	`tensileStrength` varchar(64),
	`density` varchar(64),
	`thermalRating` varchar(64),
	`costPerKg` int,
	`supplier` varchar(256),
	`certifications` text,
	`aiGenerated` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_materials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`offeringId` int,
	`title` varchar(256) NOT NULL,
	`description` text,
	`problemStatement` text,
	`marketReqs` text,
	`technicalReqs` text,
	`erlProjectStatus` enum('draft','active','on_hold','completed','archived') DEFAULT 'draft',
	`erlCurrentStage` enum('opportunity','concept','materials','simulation','prototype','manufacturing','validation','ip') DEFAULT 'opportunity',
	`erlPriority` enum('low','medium','high','critical') DEFAULT 'medium',
	`targetCompletionDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_simulations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stageId` int,
	`erlSimType` enum('fea','thermal','fatigue','cfd','impact','vibration','lifecycle') NOT NULL,
	`title` varchar(256) NOT NULL,
	`softwareTool` varchar(128),
	`inputParams` text,
	`results` text,
	`aiAnalysis` text,
	`passedValidation` boolean DEFAULT false,
	`safetyFactor` varchar(32),
	`iterationNumber` int DEFAULT 1,
	`erlSimStatus` enum('queued','running','completed','failed','needs_iteration') DEFAULT 'queued',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_simulations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_stages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`erlStageType` enum('opportunity','concept','materials','simulation','prototype','manufacturing','validation','ip') NOT NULL,
	`erlStageStatus` enum('pending','in_progress','human_review','completed','blocked') DEFAULT 'pending',
	`agentId` varchar(64),
	`inputData` text,
	`outputData` text,
	`aiNarrative` text,
	`performanceTargets` text,
	`validationCriteria` text,
	`humanApproved` boolean DEFAULT false,
	`humanNotes` text,
	`iterationCount` int DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `erl_validation_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stageId` int,
	`erlValidationType` enum('performance','compliance','lifecycle','safety','market','technical') NOT NULL,
	`title` varchar(256) NOT NULL,
	`standard` varchar(256),
	`testMethod` text,
	`results` text,
	`passed` boolean DEFAULT false,
	`score` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erl_validation_logs_id` PRIMARY KEY(`id`)
);
