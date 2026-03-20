CREATE TABLE `auditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(64),
	`userName` varchar(255),
	`action` varchar(128) NOT NULL,
	`module` varchar(64) NOT NULL,
	`resourceType` varchar(64),
	`resourceId` varchar(64),
	`ventureId` varchar(64),
	`before` text,
	`after` text,
	`ipAddress` varchar(64),
	`userAgent` text,
	`status` varchar(32) DEFAULT 'success',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceChecks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`framework` varchar(128) NOT NULL,
	`requirement` varchar(512) NOT NULL,
	`status` enum('not_started','in_progress','compliant','non_compliant','exempt','under_review') DEFAULT 'not_started',
	`owner` varchar(255),
	`dueDate` varchar(32),
	`evidenceUrl` text,
	`notes` text,
	`lastReviewed` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceChecks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governancePolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyName` varchar(255) NOT NULL,
	`module` varchar(64) NOT NULL,
	`allowedRoles` text NOT NULL,
	`permissionLevel` enum('read','write','admin','none') NOT NULL DEFAULT 'read',
	`description` text,
	`isActive` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `governancePolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskRegister` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`title` varchar(512) NOT NULL,
	`category` enum('strategic','operational','financial','legal','technical','reputational','environmental') NOT NULL DEFAULT 'operational',
	`likelihood` int DEFAULT 3,
	`impact` int DEFAULT 3,
	`riskScore` int,
	`status` enum('open','mitigated','accepted','closed','escalated') DEFAULT 'open',
	`owner` varchar(255),
	`mitigationPlan` text,
	`residualRisk` int,
	`reviewDate` varchar(32),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskRegister_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `venturePermissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`role` enum('owner','editor','viewer','advisor','investor') NOT NULL DEFAULT 'viewer',
	`grantedBy` varchar(64),
	`expiresAt` timestamp,
	`notes` text,
	`isActive` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venturePermissions_id` PRIMARY KEY(`id`)
);
