CREATE TABLE `workflowTriggerLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triggerType` varchar(64) NOT NULL,
	`sourceModule` varchar(64) NOT NULL,
	`sourceRecordId` int NOT NULL,
	`targetModule` varchar(64),
	`targetRecordId` int,
	`ventureId` varchar(64),
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`payload` text,
	`result` text,
	`error` text,
	`retriedFrom` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowTriggerLog_id` PRIMARY KEY(`id`)
);
