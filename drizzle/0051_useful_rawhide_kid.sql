CREATE TABLE `sync_assessments` (
	`syncId` varchar(36) NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`trl` int NOT NULL,
	`mrl` int NOT NULL,
	`delta` int NOT NULL,
	`psi` decimal(8,4) NOT NULL,
	`rho` decimal(8,4) NOT NULL,
	`eta` decimal(6,4) NOT NULL,
	`vrlPenalty` decimal(6,4) NOT NULL,
	`adjustedVrl` decimal(5,2),
	`wStage` decimal(5,3) NOT NULL,
	`wVelocity` decimal(6,4) NOT NULL,
	`syncSeverity` enum('OK','WATCH','AMBER','RED') NOT NULL,
	`primaryPath` varchar(40) NOT NULL,
	`domainSupply` decimal(4,3) NOT NULL DEFAULT '0.500',
	`domainCost` decimal(4,3) NOT NULL DEFAULT '0.500',
	`domainCompliance` decimal(4,3) NOT NULL DEFAULT '0.500',
	`actions` json NOT NULL,
	`historySnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_assessments_syncId` PRIMARY KEY(`syncId`)
);
--> statement-breakpoint
CREATE TABLE `sync_history` (
	`historyId` varchar(36) NOT NULL,
	`ventureId` varchar(36) NOT NULL,
	`trl` int NOT NULL,
	`mrl` int NOT NULL,
	`delta` int NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_history_historyId` PRIMARY KEY(`historyId`)
);
--> statement-breakpoint
CREATE TABLE `sync_scenarios` (
	`scenarioId` varchar(36) NOT NULL,
	`name` varchar(80) NOT NULL,
	`sector` varchar(80) NOT NULL,
	`trl` int NOT NULL,
	`mrl` int NOT NULL,
	`domainSupply` decimal(4,3) NOT NULL,
	`domainCost` decimal(4,3) NOT NULL,
	`domainCompliance` decimal(4,3) NOT NULL,
	`history` json NOT NULL,
	`isDemo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sync_scenarios_scenarioId` PRIMARY KEY(`scenarioId`)
);
