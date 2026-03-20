CREATE TABLE `finExitWaterfall` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`exitValuation` int DEFAULT 0,
	`exitType` enum('acquisition','ipo','secondary','mbo','liquidation') DEFAULT 'acquisition',
	`preMoneyValuation` int DEFAULT 0,
	`totalInvested` int DEFAULT 0,
	`liquidationPref` enum('none','1x_non_participating','1x_participating','2x_non_participating') DEFAULT '1x_non_participating',
	`antiDilution` enum('none','broad_based','narrow_based','full_ratchet') DEFAULT 'none',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finExitWaterfall_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finInvestorReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`title` varchar(255) NOT NULL,
	`period` varchar(64),
	`reportType` enum('monthly','quarterly','annual','ad_hoc') DEFAULT 'monthly',
	`status` enum('draft','review','sent','archived') DEFAULT 'draft',
	`highlights` text,
	`challenges` text,
	`nextSteps` text,
	`kpiSnapshot` text,
	`generatedBy` varchar(255),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finInvestorReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finPlLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`category` enum('revenue','cogs','gross_profit','opex','ebitda','depreciation','ebit','interest','tax','net_profit') NOT NULL DEFAULT 'revenue',
	`lineItem` varchar(255) NOT NULL,
	`year1` int DEFAULT 0,
	`year2` int DEFAULT 0,
	`year3` int DEFAULT 0,
	`year4` int DEFAULT 0,
	`year5` int DEFAULT 0,
	`unit` varchar(32) DEFAULT 'GBP',
	`notes` text,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finPlLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finRunwayScenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`name` varchar(255) NOT NULL,
	`cashBalance` int DEFAULT 0,
	`monthlyBurn` int DEFAULT 0,
	`monthlyRevenue` int DEFAULT 0,
	`growthRate` int DEFAULT 0,
	`runwayMonths` int,
	`breakEvenMonth` int,
	`scenario` enum('base','optimistic','pessimistic') DEFAULT 'base',
	`assumptions` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finRunwayScenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finUnitEconomics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64),
	`period` varchar(32),
	`cac` int DEFAULT 0,
	`ltv` int DEFAULT 0,
	`arpu` int DEFAULT 0,
	`churnRate` int DEFAULT 0,
	`grossMargin` int DEFAULT 0,
	`paybackMonths` int,
	`ltvCacRatio` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `finUnitEconomics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finWaterfallTranches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`waterfallId` int NOT NULL,
	`investorName` varchar(255) NOT NULL,
	`investorType` enum('founder','angel','seed','series_a','series_b','employee','option_pool') DEFAULT 'angel',
	`shares` int DEFAULT 0,
	`ownershipPct` int DEFAULT 0,
	`invested` int DEFAULT 0,
	`pref` enum('common','preferred') DEFAULT 'common',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `finWaterfallTranches_id` PRIMARY KEY(`id`)
);
