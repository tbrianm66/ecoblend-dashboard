CREATE TABLE `flower_export_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`ventureName` varchar(255) NOT NULL,
	`exportedBy` varchar(255) NOT NULL,
	`rowCount` int NOT NULL DEFAULT 0,
	`snapshotMonth` varchar(7),
	`includesFinancials` boolean DEFAULT true,
	`includesReadiness` boolean DEFAULT true,
	`includesGrowthMetrics` boolean DEFAULT true,
	`status` enum('Success','Partial','Failed') DEFAULT 'Success',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flower_export_log_id` PRIMARY KEY(`id`)
);
