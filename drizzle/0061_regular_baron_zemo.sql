CREATE TABLE `founder_notifications` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`founderId` varchar(64) NOT NULL,
	`type` enum('alert_acknowledged','session_confirmed','session_rescheduled','session_declined','self_assessment_approved','self_assessment_rejected','leaderboard_rank_change','commitment_due','prl_score_updated','goal_updated','general') NOT NULL DEFAULT 'general',
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`sourceId` varchar(64),
	`sourceType` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `founder_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prl_goals` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`founderId` varchar(64) NOT NULL,
	`coachId` varchar(64) NOT NULL,
	`targetScore` int NOT NULL,
	`targetDate` date NOT NULL,
	`startScore` int NOT NULL,
	`currentScore` int NOT NULL,
	`status` enum('active','achieved','missed','cancelled') NOT NULL DEFAULT 'active',
	`notes` text,
	`achievedAt` timestamp,
	`progressPercent` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prl_goals_id` PRIMARY KEY(`id`)
);
