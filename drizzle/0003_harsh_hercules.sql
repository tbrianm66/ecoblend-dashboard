CREATE TABLE `evidence_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ventureId` varchar(64) NOT NULL,
	`paperId` int,
	`claimText` text NOT NULL,
	`claimType` enum('Market Validation','Technology Feasibility','Social Impact','Competitive Advantage','Regulatory Compliance','Financial Model','Team Capability','Methodology Support') DEFAULT 'Market Validation',
	`trlLevel` int,
	`vrlStage` int,
	`strength` enum('Strong','Moderate','Weak') DEFAULT 'Moderate',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fellow_researchers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`title` varchar(255),
	`institution` varchar(255),
	`department` varchar(255),
	`specialisation` text,
	`email` varchar(320),
	`linkedIn` varchar(255),
	`orcid` varchar(64),
	`collaborationType` enum('Academic Advisor','Co-Researcher','Industry Fellow','Visiting Scholar','PhD Supervisor','Peer Reviewer','Consultant') DEFAULT 'Academic Advisor',
	`status` enum('Active','Prospective','Past') DEFAULT 'Active',
	`ventureIds` text,
	`bio` text,
	`publications` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fellow_researchers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(512) NOT NULL,
	`authors` text NOT NULL,
	`journal` varchar(255),
	`year` int,
	`doi` varchar(255),
	`url` text,
	`abstract` text,
	`keywords` text,
	`category` enum('VRL Framework','TRL Framework','Lean Methodology','Social Enterprise','Impact Investing','Circular Economy','Sports Technology','Eco Materials','Venture Building','University Spin-out','Other') DEFAULT 'Other',
	`evidenceType` enum('Peer Reviewed','Conference Paper','Thesis','Industry Report','Government Report','Book Chapter','Working Paper') DEFAULT 'Peer Reviewed',
	`relevanceScore` int DEFAULT 5,
	`ventureIds` text,
	`trlLevelsSupported` text,
	`vrlStagesSupported` text,
	`notes` text,
	`addedBy` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_papers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `university_partnerships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`universityName` varchar(255) NOT NULL,
	`country` varchar(128),
	`department` varchar(255),
	`contactName` varchar(128),
	`contactEmail` varchar(320),
	`partnershipType` enum('Research Collaboration','Spin-out Support','Knowledge Transfer','Student Placement','Grant Co-applicant','Advisory Board','MoU') DEFAULT 'Research Collaboration',
	`status` enum('Active','Prospective','Completed','Paused') DEFAULT 'Prospective',
	`startDate` varchar(32),
	`endDate` varchar(32),
	`description` text,
	`ventureIds` text,
	`fundingLinked` boolean DEFAULT false,
	`fundingAmount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `university_partnerships_id` PRIMARY KEY(`id`)
);
