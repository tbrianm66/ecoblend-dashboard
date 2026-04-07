CREATE TABLE `alert_schedule_log` (
	`id` varchar(64) NOT NULL,
	`triggeredAt` timestamp NOT NULL DEFAULT (now()),
	`triggeredBy` enum('manual','scheduled','api') NOT NULL DEFAULT 'manual',
	`foundersScanned` int NOT NULL DEFAULT 0,
	`alertsGenerated` int NOT NULL DEFAULT 0,
	`alertsCritical` int NOT NULL DEFAULT 0,
	`alertsWarning` int NOT NULL DEFAULT 0,
	`alertsInfo` int NOT NULL DEFAULT 0,
	`durationMs` int,
	`status` enum('success','partial','failed') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`weekOf` date NOT NULL,
	CONSTRAINT `alert_schedule_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coach_trend_cache` (
	`id` varchar(64) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`coachName` varchar(256) NOT NULL,
	`sparklineData` json NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`weekCount` int NOT NULL DEFAULT 0,
	`minScore` decimal(5,2),
	`maxScore` decimal(5,2),
	`latestScore` decimal(5,2),
	`trendDirection` enum('improving','declining','stable') NOT NULL DEFAULT 'stable',
	CONSTRAINT `coach_trend_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `report_delivery_log` (
	`id` varchar(64) NOT NULL,
	`reportId` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`sentBy` varchar(128),
	`channel` enum('notification','email','manual') NOT NULL DEFAULT 'notification',
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	`notificationId` varchar(128),
	CONSTRAINT `report_delivery_log_id` PRIMARY KEY(`id`)
);
