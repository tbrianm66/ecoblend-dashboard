CREATE TABLE `specialistCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`specialistId` int NOT NULL,
	`serviceTaskId` int,
	`title` varchar(255) NOT NULL,
	`brief` text,
	`status` varchar(32) NOT NULL DEFAULT 'Open',
	`budget` decimal(10,2),
	`agreedFee` decimal(10,2),
	`platformFee` decimal(10,2),
	`startDate` timestamp,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `specialistCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialistServiceTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(128) NOT NULL,
	`priority` varchar(32) NOT NULL DEFAULT 'Medium',
	`status` varchar(32) NOT NULL DEFAULT 'Open',
	`brlStage` int DEFAULT 1,
	`estimatedHrs` decimal(6,1),
	`assignedTo` int,
	`dueDate` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `specialistServiceTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `specialists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`rate` varchar(64) NOT NULL DEFAULT 'TBD',
	`availability` varchar(32) NOT NULL DEFAULT 'Available',
	`rating` decimal(3,1) DEFAULT '5.0',
	`completedJobs` int DEFAULT 0,
	`bio` text,
	`skills` text,
	`portfolioUrl` varchar(512),
	`linkedinUrl` varchar(512),
	`isVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `specialists_id` PRIMARY KEY(`id`)
);
