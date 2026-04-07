CREATE TABLE `coaching_session_requests` (
	`id` varchar(64) NOT NULL,
	`founderId` varchar(128) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`preferredDate` timestamp,
	`alternateDate` timestamp,
	`sessionType` enum('prl_review','commitment_check','strategy','wellbeing','ad_hoc') NOT NULL DEFAULT 'prl_review',
	`founderNotes` text,
	`status` enum('pending','confirmed','rescheduled','cancelled','completed') NOT NULL DEFAULT 'pending',
	`confirmedDate` timestamp,
	`coachNotes` text,
	`meetingLink` varchar(512),
	`sessionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `coaching_session_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `founder_leaderboard_snapshots` (
	`id` varchar(64) NOT NULL,
	`founderId` varchar(128) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`vrlStage` int NOT NULL DEFAULT 1,
	`weekOf` date NOT NULL,
	`prlScore` decimal(5,2),
	`rankInCohort` int,
	`cohortSize` int,
	`percentile` decimal(5,2),
	`deltaFromPrev` decimal(5,2),
	`isOptedIn` boolean NOT NULL DEFAULT false,
	`displayAlias` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founder_leaderboard_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_effectiveness_cache` (
	`id` varchar(64) NOT NULL,
	`templateId` varchar(64) NOT NULL,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`totalAssigned` int NOT NULL DEFAULT 0,
	`totalCompleted` int NOT NULL DEFAULT 0,
	`completionRate` decimal(5,2),
	`avgPrlUplift` decimal(5,2),
	`avgDaysToComplete` decimal(5,2),
	`effectivenessScore` decimal(5,2),
	`rank` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `template_effectiveness_cache_id` PRIMARY KEY(`id`)
);
