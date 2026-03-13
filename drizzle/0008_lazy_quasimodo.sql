CREATE TABLE `brl_task_completions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`taskId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`completedBy` varchar(128),
	`notes` text,
	`evidenceUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brl_task_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brl_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskNumber` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` enum('Legal & Entity','Intellectual Property','Brand Identity','Financial','Technology & Product','Market & Customer','Partnerships & OEM','Governance & Compliance','People & Team','Go-to-Market','Scaling') NOT NULL,
	`vrlStage` int NOT NULL,
	`platformScope` enum('Fundamentals','Kick-off','Execution') NOT NULL DEFAULT 'Fundamentals',
	`linkedModule` varchar(128),
	`weight` float NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brl_tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `brl_tasks_taskNumber_unique` UNIQUE(`taskNumber`)
);
