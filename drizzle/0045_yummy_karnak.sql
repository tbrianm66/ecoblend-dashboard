CREATE TABLE `le_input_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceType` varchar(64) NOT NULL,
	`weight` decimal(3,2) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `le_input_weights_id` PRIMARY KEY(`id`),
	CONSTRAINT `le_input_weights_sourceType_unique` UNIQUE(`sourceType`)
);
--> statement-breakpoint
CREATE TABLE `le_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`problemId` int,
	`ventureId` int,
	`leInsightSource` enum('interview','research','experiment','market_data','book','expert_input') NOT NULL,
	`sourceId` int,
	`content` text NOT NULL,
	`evidenceStrength` int,
	`confidenceScore` decimal(3,2),
	`tags` text,
	`ipSensitive` boolean DEFAULT false,
	`extractedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `le_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_kg_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromNodeId` int NOT NULL,
	`toNodeId` int NOT NULL,
	`leEdgeRel` enum('solves','requires','competes_with','serves','collaborates','invented_by') NOT NULL,
	`weight` decimal(3,2) DEFAULT '0.50',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `le_kg_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_kg_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leNodeType` enum('problem','solution','technology','market','person','organization') NOT NULL,
	`label` varchar(256) NOT NULL,
	`ventureId` int,
	`properties` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `le_kg_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_learning_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lePatternType` enum('problem_cluster','success_indicator','failure_signal','pivot_trigger','sector_trend') NOT NULL,
	`sector` varchar(100),
	`title` varchar(256) NOT NULL,
	`description` text,
	`frequency` int DEFAULT 1,
	`confidenceScore` decimal(3,2),
	`supportingData` text,
	`isActive` boolean DEFAULT true,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `le_learning_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_problems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	`sector` varchar(100) NOT NULL,
	`frequencyScore` int,
	`severityScore` int,
	`customerSegment` varchar(200),
	`context` text,
	`leProblemStatus` enum('active','validated','invalidated','archived') NOT NULL DEFAULT 'active',
	`ventureId` int,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `le_problems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` int NOT NULL,
	`leRecType` enum('next_interview','missing_validation','technical_risk','pivot_signal','go_no_go') NOT NULL,
	`leRecPriority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`title` varchar(256) NOT NULL,
	`description` text,
	`actionItems` text,
	`confidence` decimal(3,2),
	`leRecStatus` enum('active','dismissed','completed') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `le_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `le_vrl_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` int NOT NULL,
	`trlScore` decimal(4,2),
	`brlScore` decimal(4,2),
	`alpha` decimal(3,2) DEFAULT '0.50',
	`beta` decimal(3,2) DEFAULT '0.50',
	`riskIndex` decimal(3,2),
	`confidenceScore` decimal(3,2),
	`vrlScore` decimal(5,2),
	`leVrlStage` enum('idea','validation','mvp','scale_ready','investment_ready') DEFAULT 'idea',
	`riskBreakdown` text,
	`calculationMethod` varchar(100) DEFAULT 'multiplicative_dual_risk',
	`notes` text,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `le_vrl_metrics_id` PRIMARY KEY(`id`)
);
