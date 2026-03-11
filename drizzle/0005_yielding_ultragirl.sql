CREATE TABLE `engineering_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`relatedTrlStage` int,
	`componentName` varchar(255) NOT NULL,
	`failureMode` text NOT NULL,
	`failureEffect` text NOT NULL,
	`severity` int NOT NULL DEFAULT 5,
	`occurrence` int NOT NULL DEFAULT 5,
	`detection` int NOT NULL DEFAULT 5,
	`initialRpn` int NOT NULL DEFAULT 125,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engineering_risks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mitigation_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskId` int NOT NULL,
	`actionDescription` text NOT NULL,
	`owner` varchar(128),
	`status` enum('Identified','In Progress','Implemented','Verified') NOT NULL DEFAULT 'Identified',
	`revisedSeverity` int DEFAULT 5,
	`revisedOccurrence` int DEFAULT 5,
	`revisedDetection` int DEFAULT 5,
	`revisedRpn` int DEFAULT 125,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mitigation_actions_id` PRIMARY KEY(`id`)
);
