CREATE TABLE `coaching_frl` (
	`id` varchar(64) NOT NULL,
	`founderId` int NOT NULL,
	`ventureId` varchar(64),
	`week` date NOT NULL,
	`score` decimal(5,2) NOT NULL DEFAULT '0.00',
	`trend` enum('improving','stable','declining') NOT NULL DEFAULT 'stable',
	`riskLevel` enum('HIGH','MEDIUM','LOW') NOT NULL DEFAULT 'MEDIUM',
	`completionComponent` decimal(5,2),
	`focusComponent` decimal(5,2),
	`delayPenalty` decimal(5,2),
	`missedPenalty` decimal(5,2),
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coaching_frl_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contextual_guidance_events` (
	`id` varchar(64) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`module` varchar(128),
	`eventType` varchar(64),
	`payload` text,
	`status` enum('Active','Resolved','Dismissed') DEFAULT 'Active',
	`resolvedAt` bigint,
	`createdAt` bigint NOT NULL,
	CONSTRAINT `contextual_guidance_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `frl_goals` (
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
	CONSTRAINT `frl_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_completions` (
	`id` varchar(64) NOT NULL,
	`playbookId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`ventureId` varchar(64),
	`module` varchar(128),
	`workflowStage` varchar(64),
	`completionStatus` enum('Not Started','In Progress','Completed','Needs Review','Reviewed','Reopened') DEFAULT 'Not Started',
	`completedSteps` text,
	`evidenceLinks` text,
	`completedAt` bigint,
	`reviewedBy` varchar(128),
	`reviewStatus` enum('Not Required','Pending Review','Approved','Rejected','Changes Requested') DEFAULT 'Not Required',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_completions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_context_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleName` varchar(128) NOT NULL,
	`description` text,
	`playbookId` varchar(64) NOT NULL,
	`module` varchar(128),
	`page` varchar(128),
	`workflowStage` varchar(64),
	`rdStage` varchar(64),
	`scoringFramework` varchar(64),
	`missingEvidenceTrigger` boolean DEFAULT false,
	`highRiskTrigger` boolean DEFAULT false,
	`lowScoreTrigger` boolean DEFAULT false,
	`stageGateTrigger` boolean DEFAULT false,
	`investorWarningTrigger` boolean DEFAULT false,
	`allowedRoles` text,
	`priority` int DEFAULT 50,
	`adminPriority` int DEFAULT 50,
	`suppressIfCompleted` boolean DEFAULT true,
	`allowRepeatRecommendation` boolean DEFAULT false,
	`minimumRecommendationScore` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`updatedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_context_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_library` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` varchar(128) NOT NULL,
	`relatedModule` varchar(128),
	`relatedWorkflowStage` varchar(128),
	`userRole` varchar(255),
	`purpose` text,
	`whenToUse` text,
	`stepByStepGuidance` text,
	`requiredInputs` text,
	`requiredOutputs` text,
	`linkedTemplates` text,
	`linkedScoringFrameworks` text,
	`linkedRiskCategories` text,
	`evidenceRequired` text,
	`completionChecklist` text,
	`approvalRequired` boolean DEFAULT false,
	`playbookAccessLevel` enum('Admin Only','Internal Team','Venture Team','Advisor Access','Academic Partner Access','Investor View','Public / Exportable') NOT NULL DEFAULT 'Internal Team',
	`version` varchar(16) NOT NULL DEFAULT '1.0',
	`playbookStatus` enum('Draft','Under Review','Approved','Published','Archived','Superseded') NOT NULL DEFAULT 'Draft',
	`owner` varchar(128),
	`reviewDate` varchar(32),
	`createdBy` varchar(128),
	`updatedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_library_id` PRIMARY KEY(`id`),
	CONSTRAINT `playbook_library_playbookId_unique` UNIQUE(`playbookId`)
);
--> statement-breakpoint
CREATE TABLE `playbook_usage_events` (
	`id` varchar(64) NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`playbookId` varchar(64),
	`widgetType` varchar(64),
	`userId` int,
	`ventureId` varchar(64),
	`module` varchar(128),
	`page` varchar(128),
	`contextRuleId` int,
	`recommendationScore` int,
	`actionType` varchar(64),
	`contextSnapshot` text,
	`outcome` varchar(128),
	`dismissedReason` enum('Not relevant','Already completed','Too advanced','Too basic','Wrong module','No time now','Other'),
	`createdAt` bigint NOT NULL,
	CONSTRAINT `playbook_usage_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playbookDbId` int NOT NULL,
	`version` varchar(16) NOT NULL,
	`snapshot` text NOT NULL,
	`changedBy` varchar(128),
	`changeNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playbook_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playbook_widget_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`module` varchar(128) NOT NULL,
	`widgetType` varchar(64) NOT NULL,
	`isEnabled` boolean DEFAULT true,
	`maxPlaybooks` int DEFAULT 3,
	`threshold` int DEFAULT 40,
	`position` enum('sidebar','inline','both') DEFAULT 'sidebar',
	`updatedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playbook_widget_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget_global_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enableWidgetsGlobally` boolean DEFAULT true,
	`showAsSidePanel` boolean DEFAULT true,
	`showInline` boolean DEFAULT false,
	`maxRecommendedPlaybooks` int DEFAULT 3,
	`defaultRecommendationThreshold` int DEFAULT 40,
	`enableUsageTracking` boolean DEFAULT true,
	`enableDismissalReasons` boolean DEFAULT true,
	`enableCompletionTracking` boolean DEFAULT true,
	`enableInvestorWarningGates` boolean DEFAULT true,
	`enableStageGateWarningGates` boolean DEFAULT true,
	`updatedBy` varchar(128),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_global_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget_role_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(64) NOT NULL,
	`widgetType` varchar(64) NOT NULL,
	`isVisible` boolean DEFAULT true,
	`updatedBy` varchar(128),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_role_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widget_threshold_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evidenceConfidenceWarning` int DEFAULT 50,
	`readinessScoreWarning` int DEFAULT 40,
	`highRiskThreshold` int DEFAULT 3,
	`investorPackWarning` int DEFAULT 60,
	`stageGateMinEvidence` int DEFAULT 3,
	`maxUnresolvedHighRisks` int DEFAULT 2,
	`updatedBy` varchar(128),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widget_threshold_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `coaching_prl`;--> statement-breakpoint
DROP TABLE `prl_goals`;--> statement-breakpoint
ALTER TABLE `founder_notifications` MODIFY COLUMN `type` enum('alert_acknowledged','session_confirmed','session_rescheduled','session_declined','self_assessment_approved','self_assessment_rejected','leaderboard_rank_change','commitment_due','frl_score_updated','goal_updated','general') NOT NULL DEFAULT 'general';--> statement-breakpoint
ALTER TABLE `market_analysis` MODIFY COLUMN `tamUnit` varchar(32) DEFAULT '-M';--> statement-breakpoint
ALTER TABLE `coaching_vrl_link` ADD `frlWeight` decimal(3,2) DEFAULT '0.25' NOT NULL;--> statement-breakpoint
ALTER TABLE `coaching_vrl_link` DROP COLUMN `prlWeight`;