CREATE TABLE `brandChecklistItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`category` varchar(64) NOT NULL,
	`item` varchar(255) NOT NULL,
	`completed` tinyint DEFAULT 0,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandChecklistItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brandReadinessScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`dimension` varchar(64) NOT NULL,
	`score` int DEFAULT 0,
	`notes` text,
	`assessedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brandReadinessScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketingCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`channel` varchar(64) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'Planned',
	`budget` int DEFAULT 0,
	`spent` int DEFAULT 0,
	`leads` int DEFAULT 0,
	`conversions` int DEFAULT 0,
	`startDate` varchar(32),
	`endDate` varchar(32),
	`objective` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketingChannelScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`channel` varchar(64) NOT NULL,
	`score` int DEFAULT 0,
	`period` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketingChannelScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaCoverage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`outlet` varchar(255) NOT NULL,
	`headline` varchar(512) NOT NULL,
	`url` varchar(512),
	`sentiment` varchar(32) DEFAULT 'neutral',
	`reach` int DEFAULT 0,
	`publishedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mediaCoverage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`previewText` varchar(255),
	`status` varchar(32) NOT NULL DEFAULT 'Draft',
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`recipients` int DEFAULT 0,
	`openRate` int DEFAULT 0,
	`clickRate` int DEFAULT 0,
	`unsubscribes` int DEFAULT 0,
	`contentUrl` varchar(512),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pressReleases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`summary` text,
	`status` varchar(32) NOT NULL DEFAULT 'Draft',
	`publishedAt` timestamp,
	`mediaOutlets` text,
	`coverageLinks` text,
	`reach` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pressReleases_id` PRIMARY KEY(`id`)
);
