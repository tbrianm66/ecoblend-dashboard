CREATE TABLE `contract_layers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layerKey` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`color` varchar(16),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_layers_id` PRIMARY KEY(`id`),
	CONSTRAINT `contract_layers_layerKey_unique` UNIQUE(`layerKey`)
);
--> statement-breakpoint
CREATE TABLE `contract_type_registry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`layerKey` varchar(64) NOT NULL,
	`contractType` varchar(128) NOT NULL,
	`useCase` text NOT NULL,
	`riskLevel` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
	`status` enum('Active','Draft','Pending','Not Required','Expired') DEFAULT 'Draft',
	`owner` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contract_type_registry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_risk_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskArea` varchar(128) NOT NULL,
	`description` text,
	`riskZone` enum('High','Medium','Low') DEFAULT 'Medium',
	`mitigation` text,
	`linkedLayer` varchar(64),
	`linkedContracts` text,
	`status` enum('Open','Mitigated','Monitoring','Closed') DEFAULT 'Open',
	`owner` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `legal_risk_items_id` PRIMARY KEY(`id`)
);
