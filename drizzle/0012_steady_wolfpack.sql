CREATE TABLE `knowledge_chunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`content` text NOT NULL,
	`wordCount` int DEFAULT 0,
	`pageNumber` int,
	`section` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_chunks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`sourceType` enum('pdf','transcript','url','text') NOT NULL DEFAULT 'pdf',
	`sourceUrl` varchar(1024),
	`s3Key` varchar(512),
	`domain` enum('VRL','TRL','BRL','IRL','ESG','Market','Finance','Legal','People','Brand','Strategy','General') NOT NULL DEFAULT 'General',
	`tags` varchar(512),
	`author` varchar(256),
	`publishedYear` int,
	`description` text,
	`chunkCount` int DEFAULT 0,
	`wordCount` int DEFAULT 0,
	`status` enum('pending','processing','ready','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_documents_id` PRIMARY KEY(`id`)
);
