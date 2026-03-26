CREATE TABLE `crl_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`crlAssessmentType` enum('initial','periodic','triggered') NOT NULL DEFAULT 'initial',
	`crlAssessmentStatus` enum('initiated','in_progress','completed') NOT NULL DEFAULT 'initiated',
	`crlH4Stage` enum('H4.1_ideation','H4.2_build_launch','H4.3_validation','H4.4_grow_scale') NOT NULL DEFAULT 'H4.1_ideation',
	`overallAlignmentScore` float,
	`visionScore` float,
	`operationalScore` float,
	`conflictScore` float,
	`crlScore` float,
	`crlLevel` int,
	`crlReadinessLevel` enum('high','moderate','low'),
	`confidenceScore` float,
	`aiSummary` text,
	`criticalMisalignments` text,
	`actionPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crl_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crl_founder_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`founderId` int NOT NULL,
	`founderName` varchar(128) NOT NULL,
	`questionId` varchar(16) NOT NULL,
	`crlQuestionPhase` enum('vision','operational','conflict') NOT NULL,
	`responseText` text NOT NULL,
	`responseOption` varchar(64),
	`confidenceLevel` int DEFAULT 3,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crl_founder_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crl_interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`assessmentId` int,
	`crlTriggerReason` enum('low_crl','misalignment_detected','founder_request','scheduled_review','drift_detected') NOT NULL,
	`crlInterventionType` enum('mediation','founders_agreement','coaching','conflict_resolution','check_in') NOT NULL,
	`crlInterventionStatus` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
	`participatingFounderIds` text,
	`conversationLog` text,
	`resolutionAchieved` boolean DEFAULT false,
	`agreementsDocumented` text,
	`followUpRequired` boolean DEFAULT false,
	`followUpDate` timestamp,
	`postInterventionCrl` float,
	`crlImprovement` float,
	`founderSatisfactionScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crl_interventions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crl_monitoring_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`assessmentId` int,
	`checkInDate` timestamp NOT NULL DEFAULT (now()),
	`crlMonitoringFrequency` enum('biweekly','monthly','quarterly') DEFAULT 'monthly',
	`crlScoreCurrent` float,
	`crlScorePrevious` float,
	`driftScore` float,
	`crlDriftLevel` enum('none','minor','moderate','critical') DEFAULT 'none',
	`questionsChecked` text,
	`driftDetected` boolean DEFAULT false,
	`escalationTriggered` boolean DEFAULT false,
	`aiReport` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crl_monitoring_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vrl_dynamic_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`vrlDynH4Stage` enum('H4.1_ideation','H4.2_build_launch','H4.3_validation','H4.4_grow_scale') NOT NULL DEFAULT 'H4.1_ideation',
	`alphaWeight` float NOT NULL DEFAULT 0.225,
	`betaWeight` float NOT NULL DEFAULT 0.325,
	`gammaWeight` float NOT NULL DEFAULT 0.45,
	`trlNormalized` float,
	`brlNormalized` float,
	`crlNormalized` float,
	`riskIndex` float DEFAULT 0.3,
	`confidenceScore` float DEFAULT 0.7,
	`computedVrl` float,
	`trlContribution` float,
	`brlContribution` float,
	`crlContribution` float,
	`lastCalculatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vrl_dynamic_weights_id` PRIMARY KEY(`id`),
	CONSTRAINT `vrl_dynamic_weights_ventureId_unique` UNIQUE(`ventureId`)
);
