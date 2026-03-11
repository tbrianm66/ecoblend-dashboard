CREATE TABLE `venture_risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`riskCategory` enum('Technical','Market','Commercial','Financial','Operational','Strategic') NOT NULL,
	`riskTitle` varchar(255) NOT NULL,
	`riskDescription` text,
	`likelihood` int NOT NULL DEFAULT 3,
	`impact` int NOT NULL DEFAULT 3,
	`riskScore` int NOT NULL DEFAULT 9,
	`riskLevel` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
	`vrlStageImpacted` int,
	`mitigationPlan` text,
	`riskOwner` varchar(128),
	`status` enum('Open','In Progress','Mitigated','Accepted','Closed') DEFAULT 'Open',
	`reviewDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `venture_risks_id` PRIMARY KEY(`id`)
);
