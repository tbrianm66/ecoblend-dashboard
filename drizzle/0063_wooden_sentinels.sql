CREATE TABLE `product_readiness_levels` (
	`id` varchar(36) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`trlLevel` int NOT NULL,
	`mrlLevel` int NOT NULL,
	`mrlComposite` int,
	`trlWeight` float NOT NULL DEFAULT 0.5,
	`mrlWeight` float NOT NULL DEFAULT 0.5,
	`prlScore` float NOT NULL,
	`prlLevel` int NOT NULL,
	`prlLabel` varchar(64),
	`vrlContribution` float,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	`computedBy` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_readiness_levels_id` PRIMARY KEY(`id`)
);
