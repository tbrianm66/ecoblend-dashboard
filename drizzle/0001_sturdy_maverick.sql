CREATE TABLE `contract_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` varchar(64) NOT NULL,
	`contractTitle` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSizeBytes` int NOT NULL,
	`uploadedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contract_documents_id` PRIMARY KEY(`id`)
);
