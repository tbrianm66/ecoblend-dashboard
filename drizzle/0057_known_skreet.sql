CREATE TABLE `coach_performance_snapshots` (
	`id` varchar(64) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`weekOf` date NOT NULL,
	`foundersAssigned` int NOT NULL DEFAULT 0,
	`sessionCount` int NOT NULL DEFAULT 0,
	`avgPrlImprovement` decimal(6,2) NOT NULL DEFAULT '0.00',
	`commitmentCompletionRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`highRiskFounders` int NOT NULL DEFAULT 0,
	`recoveredFounders` int NOT NULL DEFAULT 0,
	`compositeScore` decimal(5,2) NOT NULL DEFAULT '0.00',
	`rank` int,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coach_performance_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `founder_progress_reports` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`reportHtml` longtext NOT NULL,
	`aiNarrative` text,
	`prlSummary` json,
	`commitmentStats` json,
	`sessionCount` int NOT NULL DEFAULT 0,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`status` enum('draft','ready','sent') NOT NULL DEFAULT 'draft',
	CONSTRAINT `founder_progress_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prl_trend_alerts` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`alertType` enum('sharp_drop','sustained_high','first_high_risk','recovery') NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'warning',
	`message` text NOT NULL,
	`weekOf` date NOT NULL,
	`prlScore` decimal(5,2),
	`prlDelta` decimal(5,2),
	`acknowledged` boolean NOT NULL DEFAULT false,
	`acknowledgedAt` timestamp,
	`acknowledgedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prl_trend_alerts_id` PRIMARY KEY(`id`)
);
