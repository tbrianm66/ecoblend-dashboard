CREATE TABLE `coaching_behaviour_metrics` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`week` date NOT NULL,
	`completionRate` decimal(5,2) DEFAULT '0.00',
	`focusHours` decimal(4,1) DEFAULT '0.0',
	`delayTime` decimal(4,1) DEFAULT '0.0',
	`missedCommitments` int DEFAULT 0,
	`totalCommitments` int DEFAULT 0,
	`completedCommitments` int DEFAULT 0,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_behaviour_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_coaches` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`email` varchar(320),
	`type` enum('execution','strategy','wellbeing') NOT NULL DEFAULT 'execution',
	`rating` decimal(3,2) DEFAULT '0.00',
	`availability` json,
	`bio` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_coaches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_commitments` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`week` date NOT NULL,
	`task` text NOT NULL,
	`metric` text,
	`status` enum('pending','complete','missed','delayed') NOT NULL DEFAULT 'pending',
	`coachVerified` boolean DEFAULT false,
	`evidenceNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_commitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_insights` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`week` date NOT NULL,
	`prlScoreAtTime` decimal(5,2),
	`prlTrendAtTime` varchar(20),
	`risks` json,
	`patterns` json,
	`recommendations` json,
	`rawPayload` json,
	`rawResponse` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`retryCount` int DEFAULT 0,
	`status` enum('pending','generated','failed') DEFAULT 'pending',
	CONSTRAINT `coaching_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_prl` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`week` date NOT NULL,
	`score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`trend` enum('improving','stable','declining') NOT NULL DEFAULT 'stable',
	`riskLevel` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`completionComponent` decimal(5,2),
	`focusComponent` decimal(5,2),
	`delayPenalty` decimal(5,2),
	`missedPenalty` decimal(5,2),
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_prl_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_sessions` (
	`id` varchar(64) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`sessionDate` date NOT NULL,
	`notes` text,
	`actions` json,
	`sessionType` enum('check_in','deep_dive','crisis','review') DEFAULT 'check_in',
	`durationMins` int DEFAULT 60,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_vrl_link` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`prlWeight` decimal(3,2) NOT NULL DEFAULT '0.25',
	`executionScore` decimal(5,2) DEFAULT '0.00',
	`baseVrl` decimal(5,2) DEFAULT '0.00',
	`adjustedVrl` decimal(5,2) DEFAULT '0.00',
	`riskFlagged` boolean DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_vrl_link_id` PRIMARY KEY(`id`),
	CONSTRAINT `coaching_vrl_link_ventureId_unique` UNIQUE(`ventureId`)
);
