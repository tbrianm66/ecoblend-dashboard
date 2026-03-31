CREATE TABLE `brand_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`brandAssetType` enum('name_tagline','logo','colour_palette','typography','messaging_house','icp_definition','brand_voice') NOT NULL,
	`assetName` varchar(200),
	`masterLocation` varchar(500),
	`brandAssetStatus` enum('missing','draft','pending','approved') NOT NULL DEFAULT 'missing',
	`version` varchar(20) DEFAULT 'V1',
	`content` text,
	`driveUrl` varchar(500),
	`owner` varchar(100),
	`approvedAt` timestamp,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`assetId` int NOT NULL,
	`linkedModule` varchar(10) NOT NULL,
	`linkedModuleName` varchar(200),
	`linkUrl` varchar(500),
	`brandLinkType` enum('reference','embed','auto_push') NOT NULL DEFAULT 'reference',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_update_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`assetId` int NOT NULL,
	`assetType` varchar(100) NOT NULL,
	`previousStatus` varchar(50) NOT NULL,
	`newStatus` varchar(50) NOT NULL,
	`changedBy` varchar(100),
	`notifiedLeads` json,
	`downstreamFlags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brand_update_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gd_folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`moduleNumber` varchar(5) NOT NULL,
	`folderName` varchar(300) NOT NULL,
	`folderId` varchar(200),
	`driveUrl` varchar(500),
	`parentFolderId` int,
	`docCount` int NOT NULL DEFAULT 0,
	`approvedCount` int NOT NULL DEFAULT 0,
	`permissions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gd_folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gd_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`role` varchar(100) NOT NULL,
	`email` varchar(320),
	`gdAccessLevel` enum('owner','editor','commenter','viewer','no_access') NOT NULL,
	`moduleScope` json,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`grantedBy` varchar(100),
	`revokedAt` timestamp,
	CONSTRAINT `gd_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gd_workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`ventureCode` varchar(20) NOT NULL,
	`ventureName` varchar(200) NOT NULL,
	`driveId` varchar(200),
	`driveUrl` varchar(500),
	`gdWorkspaceStatus` enum('pending','creating','active','archived') NOT NULL DEFAULT 'pending',
	`totalFolders` int DEFAULT 0,
	`totalDocs` int DEFAULT 0,
	`createdBy` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSyncAt` timestamp,
	CONSTRAINT `gd_workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_summaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triggerId` int NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`intervieweeType` varchar(100),
	`painPoints` json,
	`jobsToBeDone` json,
	`emotionalSignals` json,
	`functionalSignals` json,
	`opportunityScore` decimal(4,2),
	`opportunityRationale` text,
	`hypothesesToTest` json,
	`contradictionFlags` json,
	`rawSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_summaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `insight_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`fileName` varchar(300) NOT NULL,
	`insightFileType` enum('docx','txt','pdf','mp4','mp3') NOT NULL,
	`fileUrl` varchar(500),
	`insightTriggerStatus` enum('pending','processing','complete','failed') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insight_triggers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spinoff_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`spinoffAssetType` enum('business_plan','financial_model','pitch_deck','cap_table','entity_structure','ip_map','operator_playbook','handover_pack') NOT NULL,
	`sourceModule` varchar(300),
	`destPath` varchar(300),
	`spinoffAssetStatus` enum('pending','copied','locked','missing','failed') NOT NULL DEFAULT 'pending',
	`driveUrl` varchar(500),
	`notes` text,
	`migratedAt` timestamp,
	CONSTRAINT `spinoff_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spinoff_handover_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sequenceId` int NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`executiveSummary` text,
	`operatorPlaybook` text,
	`ninetyDayPlan` text,
	`openRisks` text,
	`keyContacts` json,
	`assetLinks` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`driveUrl` varchar(500),
	CONSTRAINT `spinoff_handover_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spinoff_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`ventureCode` varchar(20) NOT NULL,
	`ventureName` varchar(200) NOT NULL,
	`triggerVrlScore` decimal(5,2) NOT NULL,
	`approvedDate` varchar(30) NOT NULL,
	`founderName` varchar(200),
	`founderEmail` varchar(320),
	`leadInvestorName` varchar(200),
	`spinoffSeqStatus` enum('pending','drive_created','assets_migrated','handover_generated','data_room_ready','completed','failed') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 1,
	`spinoffDriveUrl` varchar(500),
	`dataRoomUrl` varchar(500),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spinoff_sequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_gate_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reviewId` int NOT NULL,
	`moduleNumber` varchar(5) NOT NULL,
	`docName` varchar(300) NOT NULL,
	`docUrl` varchar(500),
	`sgEvidenceStatus` enum('present','missing','needs_approval') NOT NULL DEFAULT 'missing',
	`notes` text,
	CONSTRAINT `stage_gate_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_gate_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`sgTargetStage` enum('discover','define','build','launch','spinout') NOT NULL,
	`sgReviewStatus` enum('submitted','in_review','approved','rejected') NOT NULL DEFAULT 'submitted',
	`sgRecommendation` enum('advance','pause','requires_action'),
	`narrativeMemo` text,
	`evidenceAudit` json,
	`gapList` json,
	`submittedBy` varchar(100),
	`approvedBy` varchar(100),
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stage_gate_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vrl_actions_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`action` text NOT NULL,
	`owner` varchar(100),
	`vrlActionStatus` enum('pending','in_progress','complete','cancelled') NOT NULL DEFAULT 'pending',
	`linkedModule` varchar(10),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vrl_actions_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vrl_spinout_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`gateKey` varchar(100) NOT NULL,
	`gateLabel` varchar(300) NOT NULL,
	`minThreshold` varchar(300),
	`evidenceRequired` varchar(500),
	`approver` varchar(100),
	`met` boolean NOT NULL DEFAULT false,
	`evidenceUrl` varchar(500),
	`metAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vrl_spinout_checklist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vrl_stage_gates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(50) NOT NULL,
	`vrlStage` enum('discover','define','build','launch','spinout') NOT NULL,
	`vrlGateStatus` enum('not_started','in_progress','complete','blocked') NOT NULL DEFAULT 'not_started',
	`evidenceDocUrl` varchar(500),
	`evidenceDocName` varchar(300),
	`leadName` varchar(100),
	`score` decimal(5,2) DEFAULT '0',
	`lastUpdated` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `vrl_stage_gates_id` PRIMARY KEY(`id`)
);
