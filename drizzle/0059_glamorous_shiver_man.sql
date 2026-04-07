CREATE TABLE `commitment_templates` (
	`id` varchar(64) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`vrlStage` int NOT NULL DEFAULT 1,
	`category` varchar(128),
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`durationDays` int NOT NULL DEFAULT 7,
	`tags` json,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdBy` varchar(128),
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commitment_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `founder_self_assessments` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`weekOf` date NOT NULL,
	`strategicClarity` int NOT NULL DEFAULT 0,
	`marketValidation` int NOT NULL DEFAULT 0,
	`teamCapability` int NOT NULL DEFAULT 0,
	`operationalExecution` int NOT NULL DEFAULT 0,
	`investorPreparedness` int NOT NULL DEFAULT 0,
	`compositeScore` decimal(5,2),
	`founderNotes` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` varchar(128),
	`reviewedAt` timestamp,
	`reviewNotes` text,
	`prlRecordId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founder_self_assessments_id` PRIMARY KEY(`id`)
);
