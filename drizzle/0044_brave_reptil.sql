CREATE TABLE `dr_ai_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`ventureId` int NOT NULL,
	`templateId` int,
	`outputType` varchar(128) NOT NULL,
	`inputSummary` text,
	`generatedContent` text,
	`drGenStatus` enum('generating','completed','failed','approved','archived') NOT NULL DEFAULT 'generating',
	`approvedById` int,
	`approvedAt` timestamp,
	`tokensUsed` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_ai_generations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`roomId` int NOT NULL,
	`drReviewerRole` enum('venture_lead','finance_reviewer','legal_reviewer','technical_reviewer','impact_reviewer','platform_admin') NOT NULL,
	`drApprovalStatus` enum('pending','approved','rejected','changes_requested') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`comments` text,
	`reviewedAt` timestamp,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`ventureId` int NOT NULL,
	`drFolder` enum('01_Overview','02_Problem_Market','03_Product_Technology','04_Business_Model_Financials','05_Execution_Operations','06_Impact_Compliance','07_Legal_Corporate','08_Due_Diligence_QA','09_Access_Logs_Archive') NOT NULL DEFAULT '01_Overview',
	`name` varchar(256) NOT NULL,
	`description` text,
	`fileUrl` text,
	`fileKey` varchar(512),
	`mimeType` varchar(128),
	`fileSizeBytes` int,
	`drAssetType` enum('pitch_deck','one_pager','financial_summary','technical_dossier','impact_summary','seis_eis_pack','business_plan','exec_plan','legal_doc','cap_table','market_research','product_demo','dd_index','qa_log','other') NOT NULL DEFAULT 'other',
	`drAssetStatus` enum('draft','internal_review','approved','superseded','archived') NOT NULL DEFAULT 'draft',
	`version` int DEFAULT 1,
	`isAiGenerated` boolean DEFAULT false,
	`sourceDataRef` text,
	`approvedById` int,
	`approvedAt` timestamp,
	`drAssetTier` enum('teaser','full','due_diligence') NOT NULL DEFAULT 'teaser',
	`downloadAllowed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_engagement_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`assetId` int,
	`investorId` int,
	`drEventType` enum('room_opened','room_viewed','asset_opened','asset_viewed','asset_downloaded','question_submitted','nda_signed','meeting_requested','room_shared','access_revoked') NOT NULL,
	`durationSeconds` int,
	`ipAddress` varchar(64),
	`userAgent` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dr_engagement_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_investors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`organisation` varchar(256),
	`email` varchar(256),
	`phone` varchar(64),
	`drInvestorType` enum('angel','vc','family_office','corporate','accelerator','grant','other') NOT NULL DEFAULT 'vc',
	`drThesisFit` enum('strong','moderate','weak','unknown') NOT NULL DEFAULT 'unknown',
	`drInvestorStage` enum('identified','contacted','nda_signed','room_invited','active_review','meeting_booked','term_sheet','closed','passed') NOT NULL DEFAULT 'identified',
	`ndaSigned` boolean DEFAULT false,
	`ndaSignedAt` timestamp,
	`notes` text,
	`linkedinUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_investors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`investorId` int NOT NULL,
	`drAccessLevel` enum('teaser','full','due_diligence') NOT NULL DEFAULT 'teaser',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`acceptedAt` timestamp,
	`expiresAt` timestamp,
	`revokedAt` timestamp,
	`inviteToken` varchar(128),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dr_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_qa_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`investorId` int NOT NULL,
	`assetId` int,
	`question` text NOT NULL,
	`drQaCategory` enum('financial','legal','technical','market','team','product','compliance','other') NOT NULL DEFAULT 'other',
	`drQaPriority` enum('urgent','high','normal','low') NOT NULL DEFAULT 'normal',
	`drQaStatus` enum('open','in_progress','answered','closed') NOT NULL DEFAULT 'open',
	`responseOwnerId` int,
	`response` text,
	`respondedAt` timestamp,
	`dueDate` timestamp,
	`isPublic` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_qa_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_readiness_checks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`ventureId` int NOT NULL,
	`drCheckCategory` enum('overview','market','product','financials','legal','compliance','team','ip','governance') NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`drSeverity` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
	`drCheckStatus` enum('pending','in_progress','resolved','waived') NOT NULL DEFAULT 'pending',
	`blocksPublish` boolean DEFAULT false,
	`ownerId` int,
	`dueDate` timestamp,
	`resolvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_readiness_checks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`drRoomType` enum('teaser','full','due_diligence','custom') NOT NULL DEFAULT 'teaser',
	`drRoomStatus` enum('draft','internal_review','approved','published','expired','archived') NOT NULL DEFAULT 'draft',
	`drVisibilityTier` enum('teaser','full','due_diligence') NOT NULL DEFAULT 'teaser',
	`fundingRound` varchar(128),
	`fundingTarget` varchar(128),
	`expiresAt` timestamp,
	`publishedAt` timestamp,
	`ownerId` int,
	`watermarkEnabled` boolean DEFAULT true,
	`downloadEnabled` boolean DEFAULT false,
	`ndaRequired` boolean DEFAULT false,
	`accessCode` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dr_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`drTemplateOutput` enum('one_pager','pitch_deck','financial_summary','technical_dossier','impact_summary','seis_eis_pack','dd_index','business_plan') NOT NULL,
	`promptTemplate` text NOT NULL,
	`mandatoryInputs` text,
	`optionalInputs` text,
	`drTemplateTier` enum('teaser','full','due_diligence') NOT NULL DEFAULT 'full',
	`isActive` boolean DEFAULT true,
	`version` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dr_templates_id` PRIMARY KEY(`id`)
);
