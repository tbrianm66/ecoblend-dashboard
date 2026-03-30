CREATE TABLE `ip_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50),
	`ideaName` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`keywords` text NOT NULL,
	`industry` varchar(100) NOT NULL,
	`geography` varchar(100) NOT NULL,
	`noveltyScore` decimal(5,2) NOT NULL DEFAULT '0',
	`patentDensity` enum('LOW','MED','HIGH') NOT NULL DEFAULT 'LOW',
	`ftoRisk` enum('LOW','MED','HIGH') NOT NULL DEFAULT 'LOW',
	`recommendation` enum('PROCEED','MODIFY','KILL') NOT NULL DEFAULT 'PROCEED',
	`ipScore` decimal(5,2) NOT NULL DEFAULT '0',
	`rawResponse` json,
	`apiProvider` varchar(50) NOT NULL DEFAULT 'lightbringer_mock',
	`apiVersion` varchar(20) NOT NULL DEFAULT 'v1.0',
	`ipAnalysisStatus` enum('pending','complete','error') NOT NULL DEFAULT 'pending',
	`analysedBy` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ip_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ip_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`entityName` varchar(200) NOT NULL,
	`ipEntityType` enum('corporation','university','startup','individual','government') NOT NULL,
	`patentCount` int NOT NULL DEFAULT 0,
	`relevanceScore` decimal(5,2) NOT NULL DEFAULT '0',
	`country` varchar(100),
	`ipEntityThreat` enum('LOW','MED','HIGH') NOT NULL DEFAULT 'LOW',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ip_entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ip_vrl_feed` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`analysisId` int NOT NULL,
	`ipScore` decimal(5,2) NOT NULL,
	`vrlContribution` decimal(5,2) NOT NULL DEFAULT '0',
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`appliedBy` varchar(100),
	`notes` text,
	CONSTRAINT `ip_vrl_feed_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ip_whitespace` (
	`id` int AUTO_INCREMENT NOT NULL,
	`analysisId` int NOT NULL,
	`opportunity` varchar(500) NOT NULL,
	`ipWhitespaceCategory` enum('technology','geography','application','combination') NOT NULL,
	`potentialScore` decimal(5,2) NOT NULL DEFAULT '0',
	`actionable` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ip_whitespace_id` PRIMARY KEY(`id`)
);
