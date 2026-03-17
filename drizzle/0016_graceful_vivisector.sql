CREATE TABLE `spinoff_status_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`spinoffConfigId` int NOT NULL,
	`fromStatus` varchar(64),
	`toStatus` varchar(64) NOT NULL,
	`reviewedBy` varchar(128),
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spinoff_status_history_id` PRIMARY KEY(`id`)
);
