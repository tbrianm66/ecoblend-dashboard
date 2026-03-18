CREATE TABLE `lcssa_snapshot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`snapshotDate` timestamp NOT NULL DEFAULT (now()),
	`environmentalScore` float DEFAULT 0,
	`socialScore` float DEFAULT 0,
	`lccScore` float DEFAULT 0,
	`oversightScore` float DEFAULT 0,
	`lcssaScore` float DEFAULT 0,
	`label` varchar(64),
	`triggeredBy` varchar(64) DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lcssa_snapshot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lcssa_oversight` ADD `sdgHeatmap` text;