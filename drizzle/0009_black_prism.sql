CREATE TABLE `vrl_scoring_params` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`alphaWeight` float NOT NULL DEFAULT 0.45,
	`betaWeight` float NOT NULL DEFAULT 0.55,
	`confidenceScore` float NOT NULL DEFAULT 0.5,
	`confidenceRationale` text,
	`computedVrlScore` float,
	`computedVrlLevel` int,
	`lastCalculatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vrl_scoring_params_id` PRIMARY KEY(`id`),
	CONSTRAINT `vrl_scoring_params_ventureId_unique` UNIQUE(`ventureId`)
);
