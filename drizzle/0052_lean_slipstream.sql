CREATE TABLE `scoring_category_results` (
	`resultId` varchar(36) NOT NULL,
	`sessionId` varchar(36) NOT NULL,
	`category` varchar(30) NOT NULL,
	`scoreS` decimal(6,4) NOT NULL,
	`maturityM` decimal(4,2) NOT NULL,
	`weightW` decimal(4,2) NOT NULL,
	`contribution` decimal(8,4) NOT NULL,
	`maturityLabel` varchar(20) NOT NULL,
	`indicatorScores` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scoring_category_results_resultId` PRIMARY KEY(`resultId`)
);
--> statement-breakpoint
CREATE TABLE `scoring_datasets` (
	`datasetId` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`sector` varchar(80) NOT NULL,
	`description` text,
	`indicatorScores` json NOT NULL,
	`maturityScores` json NOT NULL,
	`isDemo` boolean NOT NULL DEFAULT true,
	`expectedMrlLevel` int,
	`expectedGateLocked` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scoring_datasets_datasetId` PRIMARY KEY(`datasetId`)
);
--> statement-breakpoint
CREATE TABLE `scoring_sessions` (
	`sessionId` varchar(36) NOT NULL,
	`ventureId` varchar(36),
	`ventureName` varchar(120),
	`mrlScore` decimal(5,1) NOT NULL,
	`mrlScoreRaw` decimal(5,1) NOT NULL,
	`mrlLevel` int NOT NULL,
	`mrlLabel` varchar(40) NOT NULL,
	`confidenceBand` decimal(5,2) NOT NULL,
	`gateLocked` boolean NOT NULL DEFAULT false,
	`gateReason` text,
	`schemaVersion` varchar(20) NOT NULL DEFAULT '1.0.0',
	`scoredBy` varchar(36),
	`assessmentType` varchar(20) NOT NULL DEFAULT 'manual',
	`snapshotHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scoring_sessions_sessionId` PRIMARY KEY(`sessionId`)
);
