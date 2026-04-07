CREATE TABLE `coaching_assignments` (
	`id` varchar(64) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`role` enum('primary','secondary','specialist') NOT NULL DEFAULT 'primary',
	`startDate` date NOT NULL,
	`endDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coaching_commitment_templates` (
	`id` varchar(64) NOT NULL,
	`vrlStage` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('product','market','execution','structural','sustainability') NOT NULL DEFAULT 'execution',
	`defaultDueOffsetDays` int NOT NULL DEFAULT 7,
	`metric` text,
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_commitment_templates_id` PRIMARY KEY(`id`)
);
