CREATE TABLE `legal_risk_escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskItemId` int NOT NULL,
	`escalatedBy` varchar(128) NOT NULL,
	`reason` text,
	`notifiedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legal_risk_escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contract_type_registry` ADD `documentUrl` text;--> statement-breakpoint
ALTER TABLE `contract_type_registry` ADD `documentKey` varchar(512);