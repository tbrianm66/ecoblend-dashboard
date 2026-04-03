CREATE TABLE `srl_assessments` (
	`id` varchar(36) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`assessmentDate` date NOT NULL,
	`srlStageAtAssmt` enum('S0','S1','S2','S3','S4') NOT NULL,
	`compositeScore` decimal(5,2) NOT NULL,
	`srlLevel` tinyint NOT NULL,
	`scoreDelta` decimal(5,2),
	`gateRef` varchar(10),
	`srlGateStatus` enum('PASS','FAIL','PENDING','NA'),
	`sustainabilityWatch` boolean NOT NULL DEFAULT false,
	`trajectoryBonus` decimal(5,2) DEFAULT '0.00',
	`weightConfigSnapshot` json NOT NULL,
	`assessedBy` varchar(200) NOT NULL,
	`isLocked` boolean NOT NULL DEFAULT false,
	`versionNo` tinyint NOT NULL DEFAULT 1,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_audit_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`srlAuditEvtType` enum('assessment','config_change','data_submission','gate_change','watch_flag','report_generated') NOT NULL,
	`ventureId` varchar(64),
	`actorId` varchar(128) NOT NULL,
	`actorRole` varchar(64),
	`eventTimestamp` timestamp NOT NULL DEFAULT (now()),
	`payloadHash` varchar(64) NOT NULL,
	`referenceId` varchar(36),
	`notes` text,
	CONSTRAINT `srl_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_data_sources` (
	`id` varchar(36) NOT NULL,
	`sourceName` varchar(200) NOT NULL,
	`srlSrcType` enum('MANUAL','API','FILE_UPLOAD','SURVEY','SYSTEM') NOT NULL,
	`endpointUrl` varchar(500),
	`frequency` varchar(30),
	`dataOwner` varchar(200),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srl_data_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_dimension_definitions` (
	`id` varchar(36) NOT NULL,
	`srlDimDefCode` enum('ENV','LCA','SMF','SOC','ESG') NOT NULL,
	`dimensionName` varchar(100) NOT NULL,
	`description` text,
	`defaultWeight` decimal(5,4) NOT NULL,
	`sortOrder` tinyint NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srl_dimension_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `srl_dimension_definitions_srlDimDefCode_unique` UNIQUE(`srlDimDefCode`)
);
--> statement-breakpoint
CREATE TABLE `srl_dimension_scores` (
	`id` varchar(36) NOT NULL,
	`assessmentId` varchar(36) NOT NULL,
	`dimensionId` varchar(36) NOT NULL,
	`srlDimScoreCode` enum('ENV','LCA','SMF','SOC','ESG') NOT NULL,
	`rawScore` decimal(5,2) NOT NULL,
	`weightedScore` decimal(5,2) NOT NULL,
	`weightApplied` decimal(5,4) NOT NULL,
	`kpiCoveragePct` decimal(5,2),
	`gatePass` boolean,
	`gateFloorValue` decimal(5,2),
	`gapFlags` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_dimension_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_gate_configs` (
	`id` varchar(36) NOT NULL,
	`srlGcCode` enum('G1','G2','G3','G4','G5') NOT NULL,
	`compositeFloor` decimal(5,2) NOT NULL,
	`srlBlockType` enum('advisory','soft','hard') NOT NULL,
	`remediationWindowDays` int NOT NULL,
	`effectiveFrom` date NOT NULL,
	`effectiveTo` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_gate_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `srl_gate_configs_srlGcCode_unique` UNIQUE(`srlGcCode`)
);
--> statement-breakpoint
CREATE TABLE `srl_gate_dimension_floors` (
	`id` varchar(36) NOT NULL,
	`gateConfigId` varchar(36) NOT NULL,
	`srlGdfDimCode` enum('ENV','LCA','SMF','SOC','ESG') NOT NULL,
	`floorValue` decimal(5,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_gate_dimension_floors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_gate_holding_status` (
	`id` varchar(36) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`srlGhsGate` enum('G1','G2','G3','G4','G5') NOT NULL,
	`srlGhsStatus` enum('REMEDIATION','HOLDING','CLEARED','ESCALATED') NOT NULL,
	`firstFailAssessmentId` varchar(36),
	`clearanceAssessmentId` varchar(36),
	`remediationStartDate` date,
	`holdingStartDate` date,
	`clearanceDate` date,
	`restartCount` tinyint NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_gate_holding_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_kpi_definitions` (
	`id` varchar(36) NOT NULL,
	`dimensionId` varchar(36) NOT NULL,
	`kpiCode` varchar(20) NOT NULL,
	`kpiName` varchar(200) NOT NULL,
	`description` text,
	`srlKpiDataType` enum('NUMERIC','PERCENT','BOOLEAN','INDEX','ORDINAL') NOT NULL,
	`unit` varchar(50) NOT NULL,
	`srlNormMethod` enum('MIN_MAX','TARGET_BASED','THRESHOLD','BINARY') NOT NULL,
	`normTarget` decimal(18,4),
	`normMin` decimal(18,4),
	`normMax` decimal(18,4),
	`thresholdValue` decimal(18,4),
	`srlThreshDir` enum('GTE','LTE','EQ'),
	`isMandatory` boolean NOT NULL DEFAULT false,
	`higherIsBetter` boolean NOT NULL DEFAULT true,
	`sdgTag` varchar(50),
	`griTag` varchar(50),
	`tcfdTag` varchar(50),
	`sasbTag` varchar(50),
	`activatedByTrlLevel` tinyint,
	`activatedByMrlLevel` tinyint,
	`effectiveFrom` date NOT NULL,
	`effectiveTo` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srl_kpi_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `srl_kpi_definitions_kpiCode_unique` UNIQUE(`kpiCode`)
);
--> statement-breakpoint
CREATE TABLE `srl_kpi_values` (
	`id` varchar(36) NOT NULL,
	`dimScoreId` varchar(36) NOT NULL,
	`kpiDefId` varchar(36) NOT NULL,
	`kpiCode` varchar(20) NOT NULL,
	`sourceId` varchar(36) NOT NULL,
	`rawValue` decimal(18,4),
	`unit` varchar(50) NOT NULL,
	`normalisedValue` decimal(5,2),
	`periodStart` date,
	`periodEnd` date,
	`submittedBy` varchar(200) NOT NULL,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`evidenceRef` varchar(500),
	`isVerified` boolean NOT NULL DEFAULT false,
	`verifier` varchar(200),
	`verificationDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_kpi_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_portfolios` (
	`id` varchar(36) NOT NULL,
	`portfolioName` varchar(200) NOT NULL,
	`fundManager` varchar(200),
	`configProfile` json NOT NULL DEFAULT ('{}'),
	`currencyCode` varchar(3) NOT NULL DEFAULT 'GBP',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srl_portfolios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_reporting_outputs` (
	`id` varchar(36) NOT NULL,
	`assessmentId` varchar(36) NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`srlReportType` enum('SCORECARD','GATE_PACK','ESG_SUMMARY','EVIDENCE_BUNDLE','VRL_CONTRIBUTION','SDG_MAP') NOT NULL,
	`srlReportFormat` enum('PDF','DOCX','XLSX','JSON','HTML') NOT NULL,
	`srlReportStandard` enum('GRI','TCFD','SASB','SDG','INTERNAL'),
	`fileRef` varchar(500),
	`generatedBy` varchar(200) NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`periodStart` date,
	`periodEnd` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_reporting_outputs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `srl_venture_profiles` (
	`ventureId` varchar(64) NOT NULL,
	`portfolioId` varchar(36),
	`sectorCode` varchar(50) NOT NULL DEFAULT 'GENERAL',
	`subSector` varchar(100),
	`srlCurrentStage` enum('S0','S1','S2','S3','S4') NOT NULL DEFAULT 'S0',
	`srlCurrentLevel` tinyint DEFAULT 0,
	`srlCurrentScore` decimal(5,2) DEFAULT '0.00',
	`countryCode` varchar(2) NOT NULL DEFAULT 'GB',
	`incorporatedDate` date,
	`sustainabilityWatch` boolean NOT NULL DEFAULT false,
	`watchActivatedAt` timestamp,
	`watchLiftedAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `srl_venture_profiles_ventureId` PRIMARY KEY(`ventureId`)
);
--> statement-breakpoint
CREATE TABLE `srl_weight_configs` (
	`id` varchar(36) NOT NULL,
	`srlWcDimCode` enum('ENV','LCA','SMF','SOC','ESG') NOT NULL,
	`srlWcStage` enum('S0','S1','S2','S3','S4') NOT NULL,
	`sectorCode` varchar(64) NOT NULL DEFAULT 'default',
	`weightValue` decimal(5,4) NOT NULL,
	`effectiveFrom` date NOT NULL,
	`effectiveTo` date,
	`createdBy` varchar(128) NOT NULL DEFAULT 'system',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `srl_weight_configs_id` PRIMARY KEY(`id`)
);
