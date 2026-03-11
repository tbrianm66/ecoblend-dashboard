CREATE TABLE `academic_papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`title` varchar(512) NOT NULL,
	`authors` text NOT NULL,
	`abstract` text,
	`url` varchar(512),
	`citationCount` int NOT NULL DEFAULT 0,
	`publishedYear` int,
	`source` varchar(64) DEFAULT 'semantic_scholar',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `academic_papers_id` PRIMARY KEY(`id`),
	CONSTRAINT `academic_papers_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `task_paper_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`paperId` int NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`relevanceScore` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_paper_links_id` PRIMARY KEY(`id`)
);
