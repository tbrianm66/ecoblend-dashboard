CREATE TABLE "academic_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"externalId" varchar(255) NOT NULL,
	"title" varchar(512) NOT NULL,
	"authors" text NOT NULL,
	"abstract" text,
	"url" varchar(512),
	"citationCount" integer DEFAULT 0 NOT NULL,
	"publishedYear" integer,
	"source" varchar(64) DEFAULT 'semantic_scholar',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "academic_papers_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "alert_schedule_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"triggeredAt" timestamp DEFAULT now() NOT NULL,
	"triggeredBy" text DEFAULT 'manual' NOT NULL,
	"foundersScanned" integer DEFAULT 0 NOT NULL,
	"alertsGenerated" integer DEFAULT 0 NOT NULL,
	"alertsCritical" integer DEFAULT 0 NOT NULL,
	"alertsWarning" integer DEFAULT 0 NOT NULL,
	"alertsInfo" integer DEFAULT 0 NOT NULL,
	"durationMs" integer,
	"status" text DEFAULT 'success' NOT NULL,
	"errorMessage" text,
	"weekOf" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" varchar(64),
	"userName" varchar(255),
	"action" varchar(128) NOT NULL,
	"module" varchar(64) NOT NULL,
	"resourceType" varchar(64),
	"resourceId" varchar(64),
	"ventureId" varchar(64),
	"before" text,
	"after" text,
	"ipAddress" varchar(64),
	"userAgent" text,
	"status" varchar(32) DEFAULT 'success',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autonomy_health_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentDate" timestamp NOT NULL,
	"budgetProtectionScore" integer DEFAULT 0,
	"decisionAutonomyScore" integer DEFAULT 0,
	"metricsAppropriatenessScore" integer DEFAULT 0,
	"valueNetworkEmbeddingScore" integer DEFAULT 0,
	"totalAutonomyScore" integer DEFAULT 0,
	"autonomyLevel" text DEFAULT 'Critical',
	"budgetNotes" text,
	"decisionNotes" text,
	"metricsNotes" text,
	"valueNetworkNotes" text,
	"recommendedActions" text,
	"assessedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprintLibraryLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blueprintId" integer NOT NULL,
	"blueprintLinkDomain" text NOT NULL,
	"linkedRecordId" varchar(64) NOT NULL,
	"linkedRecordLabel" varchar(255),
	"readinessWeight" integer DEFAULT 10,
	"blueprintLinkStatus" text DEFAULT 'proposed',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"brandAssetType" text NOT NULL,
	"assetName" varchar(200),
	"masterLocation" varchar(500),
	"brandAssetStatus" text DEFAULT 'missing' NOT NULL,
	"version" varchar(20) DEFAULT 'V1',
	"content" text,
	"driveUrl" varchar(500),
	"owner" varchar(100),
	"approvedAt" timestamp,
	"lastUpdated" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brandChecklistItems" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"category" varchar(64) NOT NULL,
	"item" varchar(255) NOT NULL,
	"completed" integer DEFAULT 0,
	"completedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"assetId" integer NOT NULL,
	"linkedModule" varchar(10) NOT NULL,
	"linkedModuleName" varchar(200),
	"linkUrl" varchar(500),
	"brandLinkType" text DEFAULT 'reference' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brandReadinessScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"dimension" varchar(64) NOT NULL,
	"score" integer DEFAULT 0,
	"notes" text,
	"assessedAt" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_update_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"assetId" integer NOT NULL,
	"assetType" varchar(100) NOT NULL,
	"previousStatus" varchar(50) NOT NULL,
	"newStatus" varchar(50) NOT NULL,
	"changedBy" varchar(100),
	"notifiedLeads" json,
	"downstreamFlags" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brl_task_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"taskId" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completedAt" timestamp,
	"completedBy" varchar(128),
	"notes" text,
	"evidenceUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brl_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskNumber" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"vrlStage" integer NOT NULL,
	"platformScope" text DEFAULT 'Fundamentals' NOT NULL,
	"linkedModule" varchar(128),
	"weight" double precision DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brl_tasks_taskNumber_unique" UNIQUE("taskNumber")
);
--> statement-breakpoint
CREATE TABLE "burn_rate_metrics" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"monthlyBurnRate" numeric(12, 2),
	"cashBalance" numeric(12, 2),
	"monthlyRevenue" numeric(12, 2),
	"netBurn" numeric(12, 2),
	"runwayMonths" double precision,
	"previousRunwayMonths" double precision,
	"runwayTrend" text DEFAULT 'Stable',
	"alertStatus" text DEFAULT 'Green',
	"reportingPeriod" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_risk_inputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"sourceType" text DEFAULT 'manual' NOT NULL,
	"inputCategory" text DEFAULT 'University' NOT NULL,
	"marketRiskScore" double precision DEFAULT 50,
	"marketSizeScore" double precision DEFAULT 50,
	"competitorIntensity" double precision DEFAULT 50,
	"demandValidation" double precision DEFAULT 50,
	"esgRiskScore" double precision DEFAULT 50,
	"carbonFootprintRisk" double precision DEFAULT 50,
	"socialLicenceRisk" double precision DEFAULT 50,
	"supplyChainEsgRisk" double precision DEFAULT 50,
	"regulatoryRiskScore" double precision DEFAULT 50,
	"complianceComplexity" double precision DEFAULT 50,
	"certificationBarrier" double precision DEFAULT 50,
	"jurisdictionRisk" double precision DEFAULT 50,
	"commercialViabilityScore" double precision DEFAULT 50,
	"revenueModelClarity" double precision DEFAULT 50,
	"unitEconomicsScore" double precision DEFAULT 50,
	"partnershipReadiness" double precision DEFAULT 50,
	"strategicRiskScore" double precision DEFAULT 50,
	"ipProtectionStrength" double precision DEFAULT 50,
	"teamCapabilityRisk" double precision DEFAULT 50,
	"executionTrack" text DEFAULT 'BEBUS',
	"businessRiskIndex" double precision DEFAULT 50,
	"notes" text,
	"lastUpdatedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "business_risk_inputs_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "certification_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"certificationName" text NOT NULL,
	"status" text DEFAULT 'Not Started' NOT NULL,
	"progressPercent" integer DEFAULT 0,
	"certificationScore" double precision DEFAULT 0,
	"targetCertificationDate" timestamp,
	"certificationDate" timestamp,
	"expiryDate" timestamp,
	"lastAuditDate" timestamp,
	"bImpactScore" double precision,
	"bImpactGovernance" double precision,
	"bImpactWorkers" double precision,
	"bImpactCommunity" double precision,
	"bImpactEnvironment" double precision,
	"bImpactCustomers" double precision,
	"certifyingBody" varchar(128),
	"certificateUrl" varchar(512),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "co_founder_compatibility" (
	"id" serial PRIMARY KEY NOT NULL,
	"talentProfileIdA" integer NOT NULL,
	"talentProfileIdB" integer NOT NULL,
	"productOpportunityId" integer,
	"capabilityComplementScore" integer DEFAULT 0,
	"valueAlignmentScore" integer DEFAULT 0,
	"workingStyleScore" integer DEFAULT 0,
	"networkComplementScore" integer DEFAULT 0,
	"overallCompatibilityScore" integer DEFAULT 0,
	"compatibilityRationale" text,
	"computedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_performance_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"weekOf" date NOT NULL,
	"foundersAssigned" integer DEFAULT 0 NOT NULL,
	"sessionCount" integer DEFAULT 0 NOT NULL,
	"avgPrlImprovement" numeric(6, 2) DEFAULT '0.00' NOT NULL,
	"commitmentCompletionRate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"highRiskFounders" integer DEFAULT 0 NOT NULL,
	"recoveredFounders" integer DEFAULT 0 NOT NULL,
	"compositeScore" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"rank" integer,
	"computedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_trend_cache" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"coachName" varchar(256) NOT NULL,
	"sparklineData" json NOT NULL,
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	"weekCount" integer DEFAULT 0 NOT NULL,
	"minScore" numeric(5, 2),
	"maxScore" numeric(5, 2),
	"latestScore" numeric(5, 2),
	"trendDirection" text DEFAULT 'stable' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_assignments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"role" text DEFAULT 'primary' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_behaviour_metrics" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"week" date NOT NULL,
	"completionRate" numeric(5, 2) DEFAULT '0.00',
	"focusHours" numeric(4, 1) DEFAULT '0.0',
	"delayTime" numeric(4, 1) DEFAULT '0.0',
	"missedCommitments" integer DEFAULT 0,
	"totalCommitments" integer DEFAULT 0,
	"completedCommitments" integer DEFAULT 0,
	"calculatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_coaches" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(320),
	"type" text DEFAULT 'execution' NOT NULL,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"availability" json,
	"bio" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_commitment_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"vrlStage" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"category" text DEFAULT 'execution' NOT NULL,
	"defaultDueOffsetDays" integer DEFAULT 7 NOT NULL,
	"metric" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_commitments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"week" date NOT NULL,
	"task" text NOT NULL,
	"metric" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"coachVerified" boolean DEFAULT false,
	"evidenceNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_frl" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"week" date NOT NULL,
	"score" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"trend" text DEFAULT 'stable' NOT NULL,
	"riskLevel" text DEFAULT 'MEDIUM' NOT NULL,
	"completionComponent" numeric(5, 2),
	"focusComponent" numeric(5, 2),
	"delayPenalty" numeric(5, 2),
	"missedPenalty" numeric(5, 2),
	"calculatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_insights" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"week" date NOT NULL,
	"prlScoreAtTime" numeric(5, 2),
	"prlTrendAtTime" varchar(20),
	"risks" json,
	"patterns" json,
	"recommendations" json,
	"rawPayload" json,
	"rawResponse" json,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"retryCount" integer DEFAULT 0,
	"status" text DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "coaching_onboarding_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"founder_id" varchar(255) NOT NULL,
	"current_vrl_stage" integer DEFAULT 1 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"template_applied" boolean DEFAULT false NOT NULL,
	"completed_at" integer,
	"created_at" integer NOT NULL,
	"updated_at" integer NOT NULL,
	CONSTRAINT "coaching_onboarding_state_founder_id_unique" UNIQUE("founder_id")
);
--> statement-breakpoint
CREATE TABLE "coaching_session_requests" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" varchar(128) NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"requestedAt" timestamp DEFAULT now() NOT NULL,
	"preferredDate" timestamp,
	"alternateDate" timestamp,
	"sessionType" text DEFAULT 'prl_review' NOT NULL,
	"founderNotes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"confirmedDate" timestamp,
	"coachNotes" text,
	"meetingLink" varchar(512),
	"sessionId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"sessionDate" date NOT NULL,
	"notes" text,
	"actions" json,
	"sessionType" text DEFAULT 'check_in',
	"durationMins" integer DEFAULT 60,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coaching_vrl_link" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"frlWeight" numeric(3, 2) DEFAULT '0.25' NOT NULL,
	"executionScore" numeric(5, 2) DEFAULT '0.00',
	"baseVrl" numeric(5, 2) DEFAULT '0.00',
	"adjustedVrl" numeric(5, 2) DEFAULT '0.00',
	"riskFlagged" boolean DEFAULT false,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coaching_vrl_link_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "cohort_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"foundingCohort" varchar(8) NOT NULL,
	"snapshotQuarter" varchar(8) NOT NULL,
	"quartersElapsed" integer NOT NULL,
	"vrlScore" double precision,
	"trlLevel" integer,
	"experimentPassRate" double precision,
	"pivotCount" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commitment_templates" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"vrlStage" integer DEFAULT 1 NOT NULL,
	"category" varchar(128),
	"priority" text DEFAULT 'medium' NOT NULL,
	"durationDays" integer DEFAULT 7 NOT NULL,
	"tags" json,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdBy" varchar(128),
	"usageCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"website" varchar(512),
	"hq" varchar(128),
	"founded" integer,
	"stage" text DEFAULT 'Unknown',
	"competitorType" text DEFAULT 'Direct',
	"productDescription" text,
	"strengths" text,
	"weaknesses" text,
	"differentiator" text,
	"revenueEstimate" varchar(64),
	"fundingRaised" varchar(64),
	"threatLevel" text DEFAULT 'Medium',
	"notes" text,
	"aiGenerated" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complianceChecks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"framework" varchar(128) NOT NULL,
	"requirement" varchar(512) NOT NULL,
	"status" text DEFAULT 'not_started',
	"owner" varchar(255),
	"dueDate" varchar(32),
	"evidenceUrl" text,
	"notes" text,
	"lastReviewed" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contextual_guidance_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"module" varchar(128),
	"eventType" varchar(64),
	"payload" text,
	"status" text DEFAULT 'Active',
	"resolvedAt" integer,
	"createdAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contingency_playbooks" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"riskType" varchar(128) NOT NULL,
	"triggerCondition" text,
	"recommendedResponse" text,
	"linkedPlaybook" varchar(255),
	"responsibleRole" varchar(128),
	"escalationPath" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"contractId" varchar(64) NOT NULL,
	"contractTitle" varchar(255) NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileUrl" text NOT NULL,
	"mimeType" varchar(128) NOT NULL,
	"fileSizeBytes" integer NOT NULL,
	"uploadedBy" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_layers" (
	"id" serial PRIMARY KEY NOT NULL,
	"layerKey" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"color" varchar(16),
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contract_layers_layerKey_unique" UNIQUE("layerKey")
);
--> statement-breakpoint
CREATE TABLE "contract_type_registry" (
	"id" serial PRIMARY KEY NOT NULL,
	"layerKey" varchar(64) NOT NULL,
	"contractType" varchar(128) NOT NULL,
	"useCase" text NOT NULL,
	"riskLevel" text DEFAULT 'Medium',
	"status" text DEFAULT 'Draft',
	"owner" varchar(128),
	"notes" text,
	"expiryDate" date,
	"documentUrl" text,
	"documentKey" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contribution_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"allocationId" integer NOT NULL,
	"memberName" varchar(128) NOT NULL,
	"contributionType" text NOT NULL,
	"description" text,
	"valueScore" double precision DEFAULT 0 NOT NULL,
	"capitalAmount" double precision DEFAULT 0,
	"evidenceUrl" varchar(512),
	"loggedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"manufacturingCostScore" integer DEFAULT 1,
	"supplyChainCostScore" integer DEFAULT 1,
	"lifecycleCostScore" integer DEFAULT 1,
	"costScore" double precision DEFAULT 0,
	"currentCostEstimate" double precision,
	"targetCostEstimate" double precision,
	"costReductionOpportunity" text,
	"assessedBy" varchar(128),
	"assessedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crl_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"crlAssessmentType" text DEFAULT 'initial' NOT NULL,
	"crlAssessmentStatus" text DEFAULT 'initiated' NOT NULL,
	"crlH4Stage" text DEFAULT 'H4.1_ideation' NOT NULL,
	"overallAlignmentScore" double precision,
	"visionScore" double precision,
	"operationalScore" double precision,
	"conflictScore" double precision,
	"crlScore" double precision,
	"crlLevel" integer,
	"crlReadinessLevel" text,
	"confidenceScore" double precision,
	"aiSummary" text,
	"criticalMisalignments" text,
	"actionPlan" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crl_founder_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessmentId" integer NOT NULL,
	"founderId" integer NOT NULL,
	"founderName" varchar(128) NOT NULL,
	"questionId" varchar(16) NOT NULL,
	"crlQuestionPhase" text NOT NULL,
	"responseText" text NOT NULL,
	"responseOption" varchar(64),
	"confidenceLevel" integer DEFAULT 3,
	"submittedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crl_interventions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" integer,
	"crlTriggerReason" text NOT NULL,
	"crlInterventionType" text NOT NULL,
	"crlInterventionStatus" text DEFAULT 'scheduled',
	"participatingFounderIds" text,
	"conversationLog" text,
	"resolutionAchieved" boolean DEFAULT false,
	"agreementsDocumented" text,
	"followUpRequired" boolean DEFAULT false,
	"followUpDate" timestamp,
	"postInterventionCrl" double precision,
	"crlImprovement" double precision,
	"founderSatisfactionScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crl_monitoring_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" integer,
	"checkInDate" timestamp DEFAULT now() NOT NULL,
	"crlMonitoringFrequency" text DEFAULT 'monthly',
	"crlScoreCurrent" double precision,
	"crlScorePrevious" double precision,
	"driftScore" double precision,
	"crlDriftLevel" text DEFAULT 'none',
	"questionsChecked" text,
	"driftDetected" boolean DEFAULT false,
	"escalationTriggered" boolean DEFAULT false,
	"aiReport" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmActivities" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"contactId" varchar(36),
	"dealId" varchar(36),
	"leadId" varchar(36),
	"type" varchar(50) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"description" text,
	"outcome" varchar(255),
	"dueAt" integer,
	"completedAt" integer,
	"status" varchar(50) DEFAULT 'pending',
	"assignedTo" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmContacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"firstName" varchar(100) NOT NULL,
	"lastName" varchar(100) NOT NULL,
	"company" varchar(255),
	"jobTitle" varchar(255),
	"email" varchar(255),
	"phone" varchar(50),
	"linkedinUrl" varchar(500),
	"contactType" varchar(50) DEFAULT 'prospect',
	"status" varchar(50) DEFAULT 'active',
	"source" varchar(100),
	"tags" text,
	"notes" text,
	"lastContactedAt" integer,
	"nextFollowUpAt" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmDeals" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"pipelineId" varchar(36),
	"stageId" varchar(36),
	"contactId" varchar(36),
	"title" varchar(255) NOT NULL,
	"company" varchar(255),
	"value" integer DEFAULT 0,
	"currency" varchar(10) DEFAULT 'GBP',
	"probability" integer DEFAULT 0,
	"expectedCloseAt" integer,
	"closedAt" integer,
	"status" varchar(50) DEFAULT 'open',
	"lostReason" varchar(255),
	"assignedTo" varchar(100),
	"tags" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmLeads" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"contactId" varchar(36),
	"title" varchar(255) NOT NULL,
	"company" varchar(255),
	"source" varchar(100),
	"status" varchar(50) DEFAULT 'new',
	"score" integer DEFAULT 0,
	"estimatedValue" integer DEFAULT 0,
	"assignedTo" varchar(100),
	"nextAction" varchar(255),
	"nextActionDate" integer,
	"notes" text,
	"convertedDealId" varchar(36),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmPipelineStages" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipelineId" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"probability" integer DEFAULT 0,
	"color" varchar(20) DEFAULT '#6b7280',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crmPipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"offeringId" varchar(36),
	"name" varchar(255) NOT NULL,
	"description" text,
	"isDefault" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "csr_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"philanthropyScore" double precision DEFAULT 0,
	"ethicalSourcingScore" double precision DEFAULT 0,
	"communityInvestmentScore" double precision DEFAULT 0,
	"employeeVolunteeringScore" double precision DEFAULT 0,
	"transparencyReportingScore" double precision DEFAULT 0,
	"csrScore" double precision DEFAULT 0,
	"csrReportPublished" boolean DEFAULT false,
	"reportingFramework" varchar(128),
	"sdgAlignments" text,
	"lastReportedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "csr_metrics_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "customer_validation_evidence" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"customerSegment" varchar(255),
	"interviewCount" integer DEFAULT 0,
	"validatedProblem" boolean DEFAULT false,
	"painIntensityScore" integer,
	"willingnessToPayScore" integer,
	"evidenceQualityScore" integer,
	"problemSolutionFitScore" integer,
	"evidenceSource" varchar(255),
	"dateCollected" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_kpi_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshotDate" varchar(32) NOT NULL,
	"totalVentures" integer DEFAULT 0,
	"activeVentures" integer DEFAULT 0,
	"prelaunchVentures" integer DEFAULT 0,
	"scalingVentures" integer DEFAULT 0,
	"pausedVentures" integer DEFAULT 0,
	"vrlStage1Count" integer DEFAULT 0,
	"vrlStage2Count" integer DEFAULT 0,
	"vrlStage3Count" integer DEFAULT 0,
	"vrlStage4Count" integer DEFAULT 0,
	"avgVrlScore" double precision DEFAULT 0,
	"investmentReadyCount" integer DEFAULT 0,
	"activeProjects" integer DEFAULT 0,
	"totalMilestonesThisMonth" integer DEFAULT 0,
	"milestonesCompletedThisMonth" integer DEFAULT 0,
	"overdueTasksCount" integer DEFAULT 0,
	"opportunitiesIdentified" integer DEFAULT 0,
	"opportunitiesScored" integer DEFAULT 0,
	"opportunitiesApproved" integer DEFAULT 0,
	"avgPosScore" double precision DEFAULT 0,
	"totalRevenueActual" integer DEFAULT 0,
	"totalInvestmentRaised" integer DEFAULT 0,
	"portfolioRoi" double precision DEFAULT 0,
	"avgIrlScore" double precision DEFAULT 0,
	"avgEsgScore" double precision DEFAULT 0,
	"certifiedVenturesCount" integer DEFAULT 0,
	"computedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmAiPipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text,
	"pipelineType" varchar(32) DEFAULT 'generation' NOT NULL,
	"model" varchar(128),
	"promptTemplate" text,
	"systemPrompt" text,
	"inputSchema" text,
	"outputSchema" text,
	"temperature" double precision,
	"maxTokens" integer,
	"topP" double precision,
	"linkedAssetIds" text,
	"linkedModule" varchar(64),
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"totalRuns" integer DEFAULT 0 NOT NULL,
	"successRate" double precision,
	"avgLatencyMs" integer,
	"avgTokensUsed" integer,
	"estimatedCostUsd" double precision,
	"version" varchar(32) DEFAULT '1.0' NOT NULL,
	"tags" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmDataAssets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text,
	"assetType" varchar(32) DEFAULT 'structured' NOT NULL,
	"sourceType" varchar(32) DEFAULT 'manual_upload' NOT NULL,
	"format" varchar(32) DEFAULT 'csv' NOT NULL,
	"sizeKb" integer,
	"rowCount" integer,
	"columnCount" integer,
	"storageUrl" text,
	"storageKey" varchar(512),
	"tags" text,
	"schema" text,
	"sampleData" text,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"linkedModule" varchar(64),
	"linkedRecordId" integer,
	"overallQuality" double precision,
	"lastValidated" timestamp,
	"ingestedBy" varchar(128),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmFeedbackEntries" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipelineId" integer,
	"runId" integer,
	"ragPipelineId" integer,
	"ventureId" varchar(64),
	"feedbackType" varchar(32) DEFAULT 'rating' NOT NULL,
	"rating" integer,
	"thumbs" varchar(8),
	"originalOutput" text,
	"correctedOutput" text,
	"comment" text,
	"inputContext" text,
	"issueCategory" varchar(64),
	"improvementAction" text,
	"status" varchar(16) DEFAULT 'open' NOT NULL,
	"submittedBy" varchar(128),
	"reviewedBy" varchar(128),
	"reviewedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmFineTuningDatasets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text,
	"taskType" varchar(64),
	"totalSamples" integer DEFAULT 0 NOT NULL,
	"labelledSamples" integer DEFAULT 0 NOT NULL,
	"trainSplit" double precision DEFAULT 0.8 NOT NULL,
	"valSplit" double precision DEFAULT 0.1 NOT NULL,
	"testSplit" double precision DEFAULT 0.1 NOT NULL,
	"storageUrl" text,
	"storageKey" varchar(512),
	"format" varchar(32) DEFAULT 'jsonl' NOT NULL,
	"linkedAssetIds" text,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"qualityScore" double precision,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmFineTuningJobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text,
	"baseModel" varchar(128) NOT NULL,
	"targetTask" varchar(128),
	"datasetId" integer,
	"trainingSamples" integer,
	"validationSamples" integer,
	"epochs" integer,
	"learningRate" double precision,
	"batchSize" integer,
	"trainLoss" double precision,
	"valLoss" double precision,
	"accuracy" double precision,
	"fineTunedModelId" varchar(255),
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"startedAt" timestamp,
	"completedAt" timestamp,
	"estimatedCostUsd" double precision,
	"actualCostUsd" double precision,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmPipelineRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"pipelineId" integer NOT NULL,
	"ventureId" varchar(64),
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"inputPayload" text,
	"outputPayload" text,
	"tokensUsed" integer,
	"latencyMs" integer,
	"costUsd" double precision,
	"errorMessage" text,
	"triggeredBy" varchar(64),
	"triggeredById" varchar(128),
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "dmQualityScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"assetId" integer NOT NULL,
	"completeness" double precision,
	"accuracy" double precision,
	"freshness" double precision,
	"consistency" double precision,
	"uniqueness" double precision,
	"validity" double precision,
	"overallScore" double precision,
	"issues" text,
	"recommendations" text,
	"assessedBy" varchar(32) DEFAULT 'manual' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmRagDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ragPipelineId" integer NOT NULL,
	"assetId" integer,
	"title" varchar(255) NOT NULL,
	"contentType" varchar(32) DEFAULT 'text' NOT NULL,
	"storageUrl" text,
	"storageKey" varchar(512),
	"chunkCount" integer DEFAULT 0 NOT NULL,
	"sizeKb" integer,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"indexedAt" timestamp,
	"metadata" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dmRagPipelines" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"description" text,
	"embeddingModel" varchar(128) DEFAULT 'text-embedding-3-small' NOT NULL,
	"chunkSize" integer DEFAULT 512 NOT NULL,
	"chunkOverlap" integer DEFAULT 64 NOT NULL,
	"retrievalStrategy" varchar(32) DEFAULT 'similarity' NOT NULL,
	"topK" integer DEFAULT 5 NOT NULL,
	"similarityThreshold" double precision DEFAULT 0.7,
	"systemPrompt" text,
	"contextTemplate" text,
	"rerankModel" varchar(128),
	"linkedAssetIds" text,
	"documentCount" integer DEFAULT 0 NOT NULL,
	"chunkCount" integer DEFAULT 0 NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"lastIndexedAt" timestamp,
	"avgRetrievalMs" integer,
	"totalQueries" integer DEFAULT 0 NOT NULL,
	"avgRelevanceScore" double precision,
	"tags" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_ai_generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"ventureId" integer NOT NULL,
	"templateId" integer,
	"outputType" varchar(128) NOT NULL,
	"inputSummary" text,
	"generatedContent" text,
	"drGenStatus" text DEFAULT 'generating' NOT NULL,
	"approvedById" integer,
	"approvedAt" timestamp,
	"tokensUsed" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"assetId" integer NOT NULL,
	"roomId" integer NOT NULL,
	"drReviewerRole" text NOT NULL,
	"drApprovalStatus" text DEFAULT 'pending' NOT NULL,
	"reviewerId" integer,
	"comments" text,
	"reviewedAt" timestamp,
	"dueDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"ventureId" integer NOT NULL,
	"drFolder" text DEFAULT '01_Overview' NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"fileUrl" text,
	"fileKey" varchar(512),
	"mimeType" varchar(128),
	"fileSizeBytes" integer,
	"drAssetType" text DEFAULT 'other' NOT NULL,
	"drAssetStatus" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"isAiGenerated" boolean DEFAULT false,
	"sourceDataRef" text,
	"approvedById" integer,
	"approvedAt" timestamp,
	"drAssetTier" text DEFAULT 'teaser' NOT NULL,
	"downloadAllowed" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_engagement_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"assetId" integer,
	"investorId" integer,
	"drEventType" text NOT NULL,
	"durationSeconds" integer,
	"ipAddress" varchar(64),
	"userAgent" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_investors" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"organisation" varchar(256),
	"email" varchar(256),
	"phone" varchar(64),
	"drInvestorType" text DEFAULT 'vc' NOT NULL,
	"drThesisFit" text DEFAULT 'unknown' NOT NULL,
	"drInvestorStage" text DEFAULT 'identified' NOT NULL,
	"ndaSigned" boolean DEFAULT false,
	"ndaSignedAt" timestamp,
	"notes" text,
	"linkedinUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"investorId" integer NOT NULL,
	"drAccessLevel" text DEFAULT 'teaser' NOT NULL,
	"invitedAt" timestamp DEFAULT now() NOT NULL,
	"acceptedAt" timestamp,
	"expiresAt" timestamp,
	"revokedAt" timestamp,
	"inviteToken" varchar(128),
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_qa_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"investorId" integer NOT NULL,
	"assetId" integer,
	"question" text NOT NULL,
	"drQaCategory" text DEFAULT 'other' NOT NULL,
	"drQaPriority" text DEFAULT 'normal' NOT NULL,
	"drQaStatus" text DEFAULT 'open' NOT NULL,
	"responseOwnerId" integer,
	"response" text,
	"respondedAt" timestamp,
	"dueDate" timestamp,
	"isPublic" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_readiness_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"roomId" integer NOT NULL,
	"ventureId" integer NOT NULL,
	"drCheckCategory" text NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"drSeverity" text DEFAULT 'medium' NOT NULL,
	"drCheckStatus" text DEFAULT 'pending' NOT NULL,
	"blocksPublish" boolean DEFAULT false,
	"ownerId" integer,
	"dueDate" timestamp,
	"resolvedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"drRoomType" text DEFAULT 'teaser' NOT NULL,
	"drRoomStatus" text DEFAULT 'draft' NOT NULL,
	"drVisibilityTier" text DEFAULT 'teaser' NOT NULL,
	"fundingRound" varchar(128),
	"fundingTarget" varchar(128),
	"expiresAt" timestamp,
	"publishedAt" timestamp,
	"ownerId" integer,
	"watermarkEnabled" boolean DEFAULT true,
	"downloadEnabled" boolean DEFAULT false,
	"ndaRequired" boolean DEFAULT false,
	"accessCode" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dr_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"drTemplateOutput" text NOT NULL,
	"promptTemplate" text NOT NULL,
	"mandatoryInputs" text,
	"optionalInputs" text,
	"drTemplateTier" text DEFAULT 'full' NOT NULL,
	"isActive" boolean DEFAULT true,
	"version" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dual_risk_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"businessRiskIndex" double precision NOT NULL,
	"productRiskIndex" double precision NOT NULL,
	"trlScore" double precision NOT NULL,
	"brlScore" double precision NOT NULL,
	"esgScore" double precision DEFAULT 50,
	"vrlScore" double precision NOT NULL,
	"vrlLevel" integer NOT NULL,
	"confidenceScore" double precision DEFAULT 0.5,
	"decision" text NOT NULL,
	"decisionRationale" text,
	"executionTrack" text DEFAULT 'None',
	"marketFeedback" text,
	"feedbackScore" double precision,
	"decidedBy" varchar(128),
	"sourceType" text DEFAULT 'Joint',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ecosystem_map_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"posX" double precision DEFAULT 50,
	"posY" double precision DEFAULT 50,
	"nodeSize" integer DEFAULT 40,
	"nodeColor" varchar(32),
	"linkedVentureIds" text,
	"linkType" text DEFAULT 'None',
	"displayLabel" varchar(64),
	"tooltipText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ecosystem_map_nodes_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "engineering_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"relatedTrlStage" integer,
	"componentName" varchar(255) NOT NULL,
	"failureMode" text NOT NULL,
	"failureEffect" text NOT NULL,
	"severity" integer DEFAULT 5 NOT NULL,
	"occurrence" integer DEFAULT 5 NOT NULL,
	"detection" integer DEFAULT 5 NOT NULL,
	"initialRpn" integer DEFAULT 125 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equity_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"memberName" varchar(128) NOT NULL,
	"memberRole" text DEFAULT 'Founder',
	"equityPct" double precision DEFAULT 0 NOT NULL,
	"vestingMonths" integer DEFAULT 48,
	"cliffMonths" integer DEFAULT 12,
	"monthsIn" integer DEFAULT 0,
	"vestingStatus" text DEFAULT 'Not Started',
	"vrlScore" double precision DEFAULT 0,
	"contributionScore" double precision DEFAULT 0,
	"capitalInput" double precision DEFAULT 0,
	"performanceScore" double precision DEFAULT 0,
	"dynamicEquityScore" double precision DEFAULT 0,
	"dynamicEquityPct" double precision DEFAULT 0,
	"stipendStatus" text DEFAULT 'Pending',
	"stipendMonthly" double precision DEFAULT 0,
	"stipendMonthsTotal" integer DEFAULT 6,
	"stipendMonthsUsed" integer DEFAULT 0,
	"legallyConverted" boolean DEFAULT false,
	"conversionDate" timestamp,
	"shareClass" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equity_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"milestoneName" varchar(128) NOT NULL,
	"milestoneType" text NOT NULL,
	"triggerVrlLevel" integer,
	"triggerRevenueGbp" double precision,
	"description" text,
	"status" text DEFAULT 'Pending',
	"triggeredAt" timestamp,
	"legalStructure" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equity_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"vrlWeight" double precision DEFAULT 0.4 NOT NULL,
	"contributionWeight" double precision DEFAULT 0.3 NOT NULL,
	"capitalWeight" double precision DEFAULT 0.2 NOT NULL,
	"performanceWeight" double precision DEFAULT 0.1 NOT NULL,
	"totalEquityPool" double precision DEFAULT 20 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equity_rules_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "erl_agent_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"stageId" integer,
	"agentId" varchar(64) NOT NULL,
	"agentName" varchar(128) NOT NULL,
	"promptUsed" text,
	"inputContext" text,
	"outputJson" text,
	"tokensUsed" integer,
	"durationMs" integer,
	"erlAgentStatus" text DEFAULT 'queued',
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_ip_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"erlIpType" text DEFAULT 'patent',
	"claimsJson" text,
	"technicalSummary" text,
	"noveltyStatement" text,
	"priorArtSearch" text,
	"draftClaims" text,
	"erlFilingStatus" text DEFAULT 'draft',
	"filingDate" timestamp,
	"grantDate" timestamp,
	"jurisdiction" varchar(128),
	"aiGenerated" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer,
	"name" varchar(256) NOT NULL,
	"erlMaterialCategory" text DEFAULT 'composite',
	"formulation" text,
	"sustainabilityScore" integer DEFAULT 0,
	"recycledContent" integer DEFAULT 0,
	"carbonFootprint" varchar(64),
	"tensileStrength" varchar(64),
	"density" varchar(64),
	"thermalRating" varchar(64),
	"costPerKg" integer,
	"supplier" varchar(256),
	"certifications" text,
	"aiGenerated" boolean DEFAULT false,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"offeringId" integer,
	"title" varchar(256) NOT NULL,
	"description" text,
	"problemStatement" text,
	"marketReqs" text,
	"technicalReqs" text,
	"erlProjectStatus" text DEFAULT 'draft',
	"erlCurrentStage" text DEFAULT 'opportunity',
	"erlPriority" text DEFAULT 'medium',
	"targetCompletionDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"stageId" integer,
	"erlSimType" text NOT NULL,
	"title" varchar(256) NOT NULL,
	"softwareTool" varchar(128),
	"inputParams" text,
	"results" text,
	"aiAnalysis" text,
	"passedValidation" boolean DEFAULT false,
	"safetyFactor" varchar(32),
	"iterationNumber" integer DEFAULT 1,
	"erlSimStatus" text DEFAULT 'queued',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"erlStageType" text NOT NULL,
	"erlStageStatus" text DEFAULT 'pending',
	"agentId" varchar(64),
	"inputData" text,
	"outputData" text,
	"aiNarrative" text,
	"performanceTargets" text,
	"validationCriteria" text,
	"humanApproved" boolean DEFAULT false,
	"humanNotes" text,
	"iterationCount" integer DEFAULT 0,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erl_validation_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"stageId" integer,
	"erlValidationType" text NOT NULL,
	"title" varchar(256) NOT NULL,
	"standard" varchar(256),
	"testMethod" text,
	"results" text,
	"passed" boolean DEFAULT false,
	"score" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "esg_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"carbonEmissionsScore" double precision DEFAULT 0,
	"energyEfficiencyScore" double precision DEFAULT 0,
	"waterManagementScore" double precision DEFAULT 0,
	"wasteCircularityScore" double precision DEFAULT 0,
	"biodiversityScore" double precision DEFAULT 0,
	"environmentalScore" double precision DEFAULT 0,
	"workerWellbeingScore" double precision DEFAULT 0,
	"diversityInclusionScore" double precision DEFAULT 0,
	"communityEngagementScore" double precision DEFAULT 0,
	"supplyChainEthicsScore" double precision DEFAULT 0,
	"socialScore" double precision DEFAULT 0,
	"boardTransparencyScore" double precision DEFAULT 0,
	"ethicsAntiCorruptionScore" double precision DEFAULT 0,
	"stakeholderEngagementScore" double precision DEFAULT 0,
	"dataPrivacyScore" double precision DEFAULT 0,
	"governanceScore" double precision DEFAULT 0,
	"esgScore" double precision DEFAULT 0,
	"esgFrameworkUsed" varchar(128),
	"lastReviewedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "esg_metrics_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "evidence_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"paperId" integer,
	"claimText" text NOT NULL,
	"claimType" text DEFAULT 'Market Validation',
	"trlLevel" integer,
	"vrlStage" integer,
	"strength" text DEFAULT 'Moderate',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"programId" integer,
	"phaseId" integer,
	"workstreamId" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"riskCategory" text DEFAULT 'Schedule',
	"likelihood" text DEFAULT 'Medium',
	"impact" text DEFAULT 'Moderate',
	"riskScore" integer DEFAULT 0,
	"riskLevel" text DEFAULT 'Medium',
	"mitigationPlan" text,
	"contingencyPlan" text,
	"owner" varchar(128),
	"status" text DEFAULT 'Open',
	"reviewDate" varchar(32),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_velocity_metrics" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"sprintName" varchar(255),
	"plannedMilestones" integer DEFAULT 0,
	"completedMilestones" integer DEFAULT 0,
	"overdueMilestones" integer DEFAULT 0,
	"velocityScore" integer,
	"deliveryConfidenceScore" integer,
	"stageGateSlippageDays" integer DEFAULT 0,
	"riskScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"hypothesis" text,
	"method" text,
	"result" text,
	"outcome" text DEFAULT 'Pending',
	"trlLevelJustified" integer,
	"offeringId" varchar(36),
	"conductedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "failure_risk_alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"alertType" varchar(128),
	"alertSeverity" text DEFAULT 'Amber',
	"alertMessage" text,
	"linkedModule" varchar(128),
	"recommendedAction" text,
	"status" text DEFAULT 'Active',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "fellow_researchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"title" varchar(255),
	"institution" varchar(255),
	"department" varchar(255),
	"specialisation" text,
	"email" varchar(320),
	"linkedIn" varchar(255),
	"orcid" varchar(64),
	"collaborationType" text DEFAULT 'Academic Advisor',
	"status" text DEFAULT 'Active',
	"ventureIds" text,
	"bio" text,
	"publications" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finExitWaterfall" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"exitValuation" integer DEFAULT 0,
	"exitType" text DEFAULT 'acquisition',
	"preMoneyValuation" integer DEFAULT 0,
	"totalInvested" integer DEFAULT 0,
	"liquidationPref" text DEFAULT '1x_non_participating',
	"antiDilution" text DEFAULT 'none',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finInvestorReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"title" varchar(255) NOT NULL,
	"period" varchar(64),
	"reportType" text DEFAULT 'monthly',
	"status" text DEFAULT 'draft',
	"highlights" text,
	"challenges" text,
	"nextSteps" text,
	"kpiSnapshot" text,
	"generatedBy" varchar(255),
	"sentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finPlLines" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"category" text DEFAULT 'revenue' NOT NULL,
	"lineItem" varchar(255) NOT NULL,
	"year1" integer DEFAULT 0,
	"year2" integer DEFAULT 0,
	"year3" integer DEFAULT 0,
	"year4" integer DEFAULT 0,
	"year5" integer DEFAULT 0,
	"unit" varchar(32) DEFAULT 'GBP',
	"notes" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finRunwayScenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"name" varchar(255) NOT NULL,
	"cashBalance" integer DEFAULT 0,
	"monthlyBurn" integer DEFAULT 0,
	"monthlyRevenue" integer DEFAULT 0,
	"growthRate" integer DEFAULT 0,
	"runwayMonths" integer,
	"breakEvenMonth" integer,
	"scenario" text DEFAULT 'base',
	"assumptions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finUnitEconomics" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"period" varchar(32),
	"cac" integer DEFAULT 0,
	"ltv" integer DEFAULT 0,
	"arpu" integer DEFAULT 0,
	"churnRate" integer DEFAULT 0,
	"grossMargin" integer DEFAULT 0,
	"paybackMonths" integer,
	"ltvCacRatio" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finWaterfallTranches" (
	"id" serial PRIMARY KEY NOT NULL,
	"waterfallId" integer NOT NULL,
	"investorName" varchar(255) NOT NULL,
	"investorType" text DEFAULT 'angel',
	"shares" integer DEFAULT 0,
	"ownershipPct" integer DEFAULT 0,
	"invested" integer DEFAULT 0,
	"pref" text DEFAULT 'common',
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"month" varchar(7) NOT NULL,
	"revenueActual" integer DEFAULT 0,
	"revenueTarget" integer DEFAULT 0,
	"monthlyBurn" integer DEFAULT 0,
	"cashRunway" integer DEFAULT 0,
	"investmentRaised" integer DEFAULT 0,
	"investmentTarget" integer DEFAULT 0,
	"notes" text,
	"churnRate" double precision,
	"retentionRate" double precision,
	"viralCoefficient" double precision,
	"referralRate" double precision,
	"customerAcquisitionCost" integer,
	"customerLifetimeValue" integer,
	"ltvCacRatio" double precision,
	"baselineRevenueTarget" integer,
	"isBaseline" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flexibility_pivot_logs" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"pivotEvent" varchar(255),
	"pivotReason" text,
	"evidenceBasedBoolean" boolean DEFAULT false,
	"recommendationsOverridden" integer DEFAULT 0,
	"playbookDismissals" integer DEFAULT 0,
	"dismissalReason" varchar(255),
	"adaptabilityScore" integer,
	"flexibilityRiskScore" integer,
	"loggedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flower_export_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"ventureName" varchar(255) NOT NULL,
	"exportedBy" varchar(255) NOT NULL,
	"rowCount" integer DEFAULT 0 NOT NULL,
	"snapshotMonth" varchar(7),
	"includesFinancials" boolean DEFAULT true,
	"includesReadiness" boolean DEFAULT true,
	"includesGrowthMetrics" boolean DEFAULT true,
	"status" text DEFAULT 'Success',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_leaderboard_snapshots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" varchar(128) NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"vrlStage" integer DEFAULT 1 NOT NULL,
	"weekOf" date NOT NULL,
	"prlScore" numeric(5, 2),
	"rankInCohort" integer,
	"cohortSize" integer,
	"percentile" numeric(5, 2),
	"deltaFromPrev" numeric(5, 2),
	"isOptedIn" boolean DEFAULT false NOT NULL,
	"displayAlias" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_match_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"talentProfileId" integer NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"sectorAlignmentScore" integer DEFAULT 0,
	"capabilityFitScore" integer DEFAULT 0,
	"availabilityScore" integer DEFAULT 0,
	"pvfScore" integer DEFAULT 0,
	"experienceScore" integer DEFAULT 0,
	"networkScore" integer DEFAULT 0,
	"overallMatchScore" integer DEFAULT 0,
	"recommendedRole" varchar(128),
	"matchRationale" text,
	"status" text DEFAULT 'Suggested',
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_notifications" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"founderId" varchar(64) NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"readAt" timestamp,
	"sourceId" varchar(64),
	"sourceType" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founderOnboardingSubmissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureName" varchar(255) NOT NULL,
	"tagline" varchar(255),
	"sector" varchar(128) NOT NULL,
	"channel" varchar(8) NOT NULL,
	"nominatedCharity" varchar(255),
	"brandColor" varchar(16),
	"bmc" text,
	"mmc" text,
	"founderName" varchar(255) NOT NULL,
	"founderEmail" varchar(255),
	"checkedTasks" text,
	"checkedCount" integer DEFAULT 0,
	"totalTasks" integer DEFAULT 26,
	"talentProfileId" integer,
	"ventureId" varchar(64),
	"status" varchar(32) DEFAULT 'Completed' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_progress_reports" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"reportHtml" text NOT NULL,
	"aiNarrative" text,
	"prlSummary" json,
	"commitmentStats" json,
	"sessionCount" integer DEFAULT 0 NOT NULL,
	"periodStart" date NOT NULL,
	"periodEnd" date NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"sentAt" timestamp,
	"status" text DEFAULT 'draft' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_self_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"weekOf" date NOT NULL,
	"strategicClarity" integer DEFAULT 0 NOT NULL,
	"marketValidation" integer DEFAULT 0 NOT NULL,
	"teamCapability" integer DEFAULT 0 NOT NULL,
	"operationalExecution" integer DEFAULT 0 NOT NULL,
	"investorPreparedness" integer DEFAULT 0 NOT NULL,
	"compositeScore" numeric(5, 2),
	"founderNotes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewedBy" varchar(128),
	"reviewedAt" timestamp,
	"reviewNotes" text,
	"prlRecordId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founder_suitability_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"talentProfileId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"domainKnowledge" integer DEFAULT 0,
	"executionCapability" integer DEFAULT 0,
	"leadershipStrength" integer DEFAULT 0,
	"networkRelevance" integer DEFAULT 0,
	"stageReadiness" integer DEFAULT 0,
	"riskProfile" integer DEFAULT 0,
	"commitmentLevel" integer DEFAULT 0,
	"overallScore" double precision DEFAULT 0,
	"recommendation" text DEFAULT 'Conditionally Suitable',
	"readinessToExecute" text DEFAULT 'Ready in 3 Months',
	"assessmentNotes" text,
	"assessedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "founders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"role" varchar(128),
	"background" text,
	"domainExpertiseScore" integer DEFAULT 0,
	"experienceScore" integer DEFAULT 0,
	"commitmentScore" integer DEFAULT 0,
	"equityPct" double precision DEFAULT 0,
	"esopAllocated" boolean DEFAULT false,
	"linkedIn" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "frl_goals" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"founderId" varchar(64) NOT NULL,
	"coachId" varchar(64) NOT NULL,
	"targetScore" integer NOT NULL,
	"targetDate" date NOT NULL,
	"startScore" integer NOT NULL,
	"currentScore" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"achievedAt" timestamp,
	"progressPercent" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funding_progression_metrics" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"currentFundingStage" varchar(64),
	"capitalRequired" numeric(12, 2),
	"capitalSecured" numeric(12, 2),
	"fundingGap" numeric(12, 2),
	"monthsToNextRaise" integer,
	"investorReadinessScore" integer,
	"pitchDeckReadyBoolean" boolean DEFAULT false,
	"businessPlanReadyBoolean" boolean DEFAULT false,
	"dataRoomReadyBoolean" boolean DEFAULT false,
	"fundingRiskScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gd_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"moduleNumber" varchar(5) NOT NULL,
	"folderName" varchar(300) NOT NULL,
	"folderId" varchar(200),
	"driveUrl" varchar(500),
	"parentFolderId" integer,
	"docCount" integer DEFAULT 0 NOT NULL,
	"approvedCount" integer DEFAULT 0 NOT NULL,
	"permissions" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gd_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceId" integer NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"role" varchar(100) NOT NULL,
	"email" varchar(320),
	"gdAccessLevel" text NOT NULL,
	"moduleScope" json,
	"grantedAt" timestamp DEFAULT now() NOT NULL,
	"grantedBy" varchar(100),
	"revokedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "gd_workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"ventureCode" varchar(20) NOT NULL,
	"ventureName" varchar(200) NOT NULL,
	"driveId" varchar(200),
	"driveUrl" varchar(500),
	"gdWorkspaceStatus" text DEFAULT 'pending' NOT NULL,
	"totalFolders" integer DEFAULT 0,
	"totalDocs" integer DEFAULT 0,
	"createdBy" varchar(100),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "governancePolicies" (
	"id" serial PRIMARY KEY NOT NULL,
	"policyName" varchar(255) NOT NULL,
	"module" varchar(64) NOT NULL,
	"allowedRoles" text NOT NULL,
	"permissionLevel" text DEFAULT 'read' NOT NULL,
	"description" text,
	"isActive" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"triggerId" integer NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"intervieweeType" varchar(100),
	"painPoints" json,
	"jobsToBeDone" json,
	"emotionalSignals" json,
	"functionalSignals" json,
	"opportunityScore" numeric(4, 2),
	"opportunityRationale" text,
	"hypothesesToTest" json,
	"contradictionFlags" json,
	"rawSummary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"fileName" varchar(300) NOT NULL,
	"insightFileType" text NOT NULL,
	"fileUrl" varchar(500),
	"insightTriggerStatus" text DEFAULT 'pending' NOT NULL,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"intervieweeName" varchar(128),
	"intervieweeRole" varchar(128),
	"intervieweeOrg" varchar(128),
	"date" varchar(32),
	"channel" text DEFAULT 'Video',
	"keyInsights" text,
	"painPoints" text,
	"validationSignals" text,
	"aiSummary" text,
	"rawTranscript" text,
	"vrlStageRelevant" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invCapTable" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"roundId" varchar(36),
	"shareholderName" varchar(255) NOT NULL,
	"shareholderType" varchar(50) DEFAULT 'founder',
	"shareClass" varchar(50) DEFAULT 'ordinary',
	"numberOfShares" integer DEFAULT 0,
	"ownershipPercent" integer DEFAULT 0,
	"pricePerShare" integer DEFAULT 0,
	"investmentAmount" integer DEFAULT 0,
	"vestingStart" integer,
	"vestingCliff" integer DEFAULT 0,
	"vestingPeriod" integer DEFAULT 0,
	"fullyDiluted" boolean DEFAULT true,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invContacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"name" varchar(255) NOT NULL,
	"fund" varchar(255),
	"role" varchar(100),
	"investorType" varchar(50) DEFAULT 'vc',
	"email" varchar(255),
	"phone" varchar(50),
	"linkedinUrl" varchar(500),
	"websiteUrl" varchar(500),
	"portfolioFocus" text,
	"geographicFocus" varchar(255),
	"minChequeSize" integer DEFAULT 0,
	"maxChequeSize" integer DEFAULT 0,
	"preferredStage" varchar(100),
	"relationshipStatus" varchar(50) DEFAULT 'prospect',
	"warmIntro" boolean DEFAULT false,
	"introSource" varchar(255),
	"lastContactedAt" integer,
	"nextFollowUpAt" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invDueDiligence" (
	"id" serial PRIMARY KEY NOT NULL,
	"roundId" varchar(36) NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"category" varchar(50) NOT NULL,
	"itemName" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"assignedTo" varchar(100),
	"documentUrl" varchar(1000),
	"dueAt" integer,
	"completedAt" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invFundingRounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"name" varchar(255) NOT NULL,
	"roundType" varchar(50) NOT NULL,
	"targetAmount" integer DEFAULT 0,
	"raisedAmount" integer DEFAULT 0,
	"preMoneyVal" integer DEFAULT 0,
	"postMoneyVal" integer DEFAULT 0,
	"equityOffered" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'planning',
	"openedAt" integer,
	"targetCloseAt" integer,
	"closedAt" integer,
	"leadInvestor" varchar(255),
	"useOfFunds" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invFundraisingRounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" integer,
	"ventureId" varchar(64),
	"roundName" varchar(128) NOT NULL,
	"invRoundType" text DEFAULT 'seed',
	"targetAmount" integer,
	"raisedAmount" integer DEFAULT 0,
	"invRoundStatus" text DEFAULT 'planning',
	"openDate" timestamp,
	"closeDate" timestamp,
	"leadInvestor" varchar(256),
	"pitchDeckId" integer,
	"businessPlanId" integer,
	"executionPlanId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invKpis" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" integer,
	"ventureId" varchar(64),
	"askAmount" integer,
	"preMoneyVal" integer,
	"useOfFunds" text,
	"revenueYear1" integer,
	"revenueYear3" integer,
	"revenueYear5" integer,
	"ebitdaYear3" integer,
	"ebitdaYear5" integer,
	"burnRate" integer,
	"runway" integer,
	"customersCount" integer,
	"revenueActual" integer,
	"growthRate" double precision,
	"nps" double precision,
	"cac" integer,
	"ltv" integer,
	"socialImpactMetric" varchar(256),
	"impactValue" varchar(128),
	"sdgAlignment" varchar(256),
	"periodLabel" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invOutputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" integer,
	"ventureId" varchar(64),
	"scoreId" integer,
	"invOutputType" text NOT NULL,
	"title" varchar(256) NOT NULL,
	"invOutputStatus" text DEFAULT 'draft',
	"contentJson" text,
	"aiNarrative" text,
	"problemSection" text,
	"opportunitySection" text,
	"solutionSection" text,
	"marketSection" text,
	"tractionSection" text,
	"businessModelSection" text,
	"supplyChainSection" text,
	"teamSection" text,
	"financialsSection" text,
	"askSection" text,
	"executiveSummarySection" text,
	"marketAnalysisSection" text,
	"productServiceSection" text,
	"commercialStrategySection" text,
	"financialProjectionsSection" text,
	"riskAnalysisSection" text,
	"roadmap90DaySection" text,
	"productDevSection" text,
	"supplyChainPlanSection" text,
	"teamPlanSection" text,
	"budgetSection" text,
	"milestonesSection" text,
	"generatedAt" timestamp,
	"version" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invReadinessScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" integer,
	"ventureId" varchar(64),
	"commercialScore" double precision DEFAULT 0,
	"technicalScore" double precision DEFAULT 0,
	"validationScore" double precision DEFAULT 0,
	"supplyChainScore" double precision DEFAULT 0,
	"impactScore" double precision DEFAULT 0,
	"investmentAttractiveness" double precision DEFAULT 0,
	"compositeScore" double precision DEFAULT 0,
	"h4Stage" varchar(32),
	"vrlScore" double precision,
	"trlScore" double precision,
	"brlScore" double precision,
	"crlScore" double precision,
	"riskIndex" double precision,
	"scoreSummary" text,
	"strengthsJson" text,
	"weaknessesJson" text,
	"gapsJson" text,
	"calculatedBy" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invTargets" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" integer,
	"ventureId" varchar(64),
	"investorName" varchar(256) NOT NULL,
	"fund" varchar(256),
	"invTargetType" text DEFAULT 'vc',
	"geographicFocus" varchar(128),
	"stageFocus" varchar(128),
	"sectorFocus" varchar(256),
	"minCheque" integer,
	"maxCheque" integer,
	"impactFocused" boolean DEFAULT false,
	"matchScore" double precision DEFAULT 0,
	"matchRationale" text,
	"invTargetStatus" text DEFAULT 'identified',
	"contactEmail" varchar(256),
	"linkedinUrl" varchar(512),
	"warmIntroSource" varchar(256),
	"lastContactedAt" timestamp,
	"nextFollowUpAt" timestamp,
	"notes" text,
	"outputSentId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invTermSheets" (
	"id" serial PRIMARY KEY NOT NULL,
	"roundId" varchar(36) NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"investorContactId" varchar(36),
	"investorName" varchar(255) NOT NULL,
	"investmentAmount" integer DEFAULT 0,
	"preMoneyVal" integer DEFAULT 0,
	"equityPercent" integer DEFAULT 0,
	"instrumentType" varchar(50) DEFAULT 'equity',
	"liquidationPref" varchar(100),
	"antiDilution" varchar(100),
	"boardSeat" boolean DEFAULT false,
	"proRataRights" boolean DEFAULT false,
	"informationRights" boolean DEFAULT true,
	"dragAlong" boolean DEFAULT false,
	"tagAlong" boolean DEFAULT false,
	"vestingSchedule" varchar(255),
	"status" varchar(50) DEFAULT 'draft',
	"receivedAt" integer,
	"expiresAt" integer,
	"signedAt" integer,
	"documentUrl" varchar(1000),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invUpdates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"roundId" varchar(36),
	"title" varchar(255) NOT NULL,
	"updateType" varchar(50) DEFAULT 'monthly',
	"content" text NOT NULL,
	"keyMetrics" text,
	"sentAt" integer,
	"recipients" text,
	"status" varchar(50) DEFAULT 'draft',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50),
	"ideaName" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"keywords" text NOT NULL,
	"industry" varchar(100) NOT NULL,
	"geography" varchar(100) NOT NULL,
	"noveltyScore" numeric(5, 2) DEFAULT '0' NOT NULL,
	"patentDensity" text DEFAULT 'LOW' NOT NULL,
	"ftoRisk" text DEFAULT 'LOW' NOT NULL,
	"recommendation" text DEFAULT 'PROCEED' NOT NULL,
	"ipScore" numeric(5, 2) DEFAULT '0' NOT NULL,
	"rawResponse" json,
	"apiProvider" varchar(50) DEFAULT 'lightbringer_mock' NOT NULL,
	"apiVersion" varchar(20) DEFAULT 'v1.0' NOT NULL,
	"ipAnalysisStatus" text DEFAULT 'pending' NOT NULL,
	"analysedBy" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"ventureName" varchar(128),
	"ventureColor" varchar(16) DEFAULT '#22c55e',
	"ipType" varchar(32) NOT NULL,
	"title" varchar(256) NOT NULL,
	"reference" varchar(64),
	"description" text,
	"status" varchar(32) DEFAULT 'Draft' NOT NULL,
	"jurisdiction" varchar(64) DEFAULT 'UK',
	"filedDate" varchar(16),
	"grantedDate" varchar(16),
	"expiryDate" varchar(16),
	"renewalDueDate" varchar(16),
	"commercialPotential" varchar(16) DEFAULT 'Medium',
	"estimatedValue" double precision DEFAULT 0,
	"trl" integer DEFAULT 1,
	"claimsCount" integer DEFAULT 0,
	"priorArtSummary" text,
	"trademarkClass" varchar(64),
	"trademarkType" varchar(32),
	"copyrightWork" varchar(64),
	"author" varchar(128),
	"designType" varchar(32),
	"secretCategory" varchar(64),
	"protectionMeasures" text,
	"ownedBy" varchar(128) DEFAULT 'EcoRace Ltd',
	"assignedTo" varchar(128),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_entities" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysisId" integer NOT NULL,
	"entityName" varchar(200) NOT NULL,
	"ipEntityType" text NOT NULL,
	"patentCount" integer DEFAULT 0 NOT NULL,
	"relevanceScore" numeric(5, 2) DEFAULT '0' NOT NULL,
	"country" varchar(100),
	"ipEntityThreat" text DEFAULT 'LOW' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_licenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ipAssetId" integer NOT NULL,
	"licensee" varchar(128) NOT NULL,
	"country" varchar(64),
	"region" varchar(64),
	"licenseType" varchar(32) DEFAULT 'Non-Exclusive' NOT NULL,
	"status" varchar(32) DEFAULT 'Negotiating' NOT NULL,
	"annualValue" double precision DEFAULT 0,
	"upfrontFee" double precision DEFAULT 0,
	"royaltyRate" double precision DEFAULT 0,
	"startDate" varchar(16),
	"endDate" varchar(16),
	"valuesAligned" boolean DEFAULT true,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ip_vrl_feed" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"analysisId" integer NOT NULL,
	"ipScore" numeric(5, 2) NOT NULL,
	"vrlContribution" numeric(5, 2) DEFAULT '0' NOT NULL,
	"appliedAt" timestamp DEFAULT now() NOT NULL,
	"appliedBy" varchar(100),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "ip_whitespace" (
	"id" serial PRIMARY KEY NOT NULL,
	"analysisId" integer NOT NULL,
	"opportunity" varchar(500) NOT NULL,
	"ipWhitespaceCategory" text NOT NULL,
	"potentialScore" numeric(5, 2) DEFAULT '0' NOT NULL,
	"actionable" boolean DEFAULT true NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "irl_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"esgScore" double precision DEFAULT 0,
	"lcaScore" double precision DEFAULT 0,
	"pcfScore" double precision DEFAULT 0,
	"csrScore" double precision DEFAULT 0,
	"certificationScore" double precision DEFAULT 0,
	"irlScore" double precision DEFAULT 0,
	"vrlScore" double precision DEFAULT 0,
	"totalVentureIntelligenceScore" double precision DEFAULT 0,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "irl_scores_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentId" integer NOT NULL,
	"chunkIndex" integer NOT NULL,
	"content" text NOT NULL,
	"wordCount" integer DEFAULT 0,
	"pageNumber" integer,
	"section" varchar(256),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"sourceType" text DEFAULT 'pdf' NOT NULL,
	"sourceUrl" varchar(1024),
	"s3Key" varchar(512),
	"domain" text DEFAULT 'General' NOT NULL,
	"tags" varchar(512),
	"author" varchar(256),
	"publishedYear" integer,
	"description" text,
	"chunkCount" integer DEFAULT 0,
	"wordCount" integer DEFAULT 0,
	"status" text DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lca_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"stage" text NOT NULL,
	"climateChangeImpact" double precision DEFAULT 0,
	"acidificationImpact" double precision DEFAULT 0,
	"eutrophicationImpact" double precision DEFAULT 0,
	"waterUsageImpact" double precision DEFAULT 0,
	"landUseImpact" double precision DEFAULT 0,
	"resourceDepletionImpact" double precision DEFAULT 0,
	"assessmentMaturityScore" double precision DEFAULT 0,
	"improvementActions" text,
	"targetReductionPercent" double precision,
	"baselineYear" integer,
	"assessedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_decision_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"decisionTitle" varchar(256) NOT NULL,
	"decisionType" text DEFAULT 'Integrated' NOT NULL,
	"lcaDimension" varchar(64),
	"rationale" text,
	"environmentalImpact" varchar(16) DEFAULT 'Neutral',
	"socialImpact" varchar(16) DEFAULT 'Neutral',
	"economicImpact" varchar(16) DEFAULT 'Neutral',
	"status" text DEFAULT 'Proposed' NOT NULL,
	"decisionDate" timestamp DEFAULT now(),
	"reviewDate" timestamp,
	"owner" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_environmental" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"carbonFootprintKg" double precision DEFAULT 0,
	"carbonFootprintScope1" double precision DEFAULT 0,
	"carbonFootprintScope2" double precision DEFAULT 0,
	"carbonFootprintScope3" double precision DEFAULT 0,
	"carbonReductionTarget" double precision DEFAULT 0,
	"energyConsumptionKwh" double precision DEFAULT 0,
	"waterUsageLitres" double precision DEFAULT 0,
	"renewableEnergyPct" double precision DEFAULT 0,
	"materialEfficiencyPct" double precision DEFAULT 0,
	"wasteGeneratedKg" double precision DEFAULT 0,
	"wasteRecycledPct" double precision DEFAULT 0,
	"airPollutionIndex" double precision DEFAULT 0,
	"waterPollutionIndex" double precision DEFAULT 0,
	"biodiversityScore" double precision DEFAULT 0,
	"landUseHectares" double precision DEFAULT 0,
	"ecosystemServicesScore" double precision DEFAULT 0,
	"environmentalScore" double precision DEFAULT 0,
	"notes" text,
	"assessmentDate" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_life_cycle_cost" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"rawMaterialCostGbp" double precision DEFAULT 0,
	"manufacturingCostGbp" double precision DEFAULT 0,
	"labourCostGbp" double precision DEFAULT 0,
	"overheadCostGbp" double precision DEFAULT 0,
	"inboundLogisticsCostGbp" double precision DEFAULT 0,
	"outboundLogisticsCostGbp" double precision DEFAULT 0,
	"warehouseCostGbp" double precision DEFAULT 0,
	"plannedMaintenanceCostGbp" double precision DEFAULT 0,
	"unplannedMaintenanceCostGbp" double precision DEFAULT 0,
	"assetLifespanYears" double precision DEFAULT 0,
	"disposalCostGbp" double precision DEFAULT 0,
	"recyclingRevGbp" double precision DEFAULT 0,
	"remediationCostGbp" double precision DEFAULT 0,
	"totalLccGbp" double precision DEFAULT 0,
	"lccScore" double precision DEFAULT 0,
	"currency" varchar(8) DEFAULT 'GBP',
	"notes" text,
	"assessmentDate" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_oversight" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"iso14001Certified" boolean DEFAULT false,
	"iso26000Adopted" boolean DEFAULT false,
	"griReportingLevel" varchar(32) DEFAULT 'None',
	"sdgAlignmentCount" integer DEFAULT 0,
	"sdgHeatmap" text,
	"policyDocumentUrl" varchar(512),
	"complianceScore" double precision DEFAULT 0,
	"reportingFrequency" varchar(32) DEFAULT 'Annual',
	"lastReportDate" timestamp,
	"nextReportDate" timestamp,
	"dataQualityScore" double precision DEFAULT 0,
	"thirdPartyVerified" boolean DEFAULT false,
	"verifierName" varchar(128),
	"reportUrl" varchar(512),
	"boardOversight" boolean DEFAULT false,
	"sustainabilityCommittee" boolean DEFAULT false,
	"stakeholderEngagementScore" double precision DEFAULT 0,
	"oversightScore" double precision DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"snapshotDate" timestamp DEFAULT now() NOT NULL,
	"environmentalScore" double precision DEFAULT 0,
	"socialScore" double precision DEFAULT 0,
	"lccScore" double precision DEFAULT 0,
	"oversightScore" double precision DEFAULT 0,
	"lcssaScore" double precision DEFAULT 0,
	"label" varchar(64),
	"triggeredBy" varchar(64) DEFAULT 'manual',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lcssa_social" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"livingWageCompliance" boolean DEFAULT false,
	"avgWorkingHoursPerWeek" double precision DEFAULT 0,
	"employeeTurnoverPct" double precision DEFAULT 0,
	"collectiveBargaining" boolean DEFAULT false,
	"humanRightsDueDiligence" boolean DEFAULT false,
	"supplyChainAuditScore" double precision DEFAULT 0,
	"childLaborRisk" varchar(16) DEFAULT 'Low',
	"forcedLaborRisk" varchar(16) DEFAULT 'Low',
	"localHiringPct" double precision DEFAULT 0,
	"communityInvestmentGbp" double precision DEFAULT 0,
	"communityEngagementScore" double precision DEFAULT 0,
	"ltifr" double precision DEFAULT 0,
	"nearMissReports" integer DEFAULT 0,
	"safetyTrainingHours" double precision DEFAULT 0,
	"healthSafetyScore" double precision DEFAULT 0,
	"socialScore" double precision DEFAULT 0,
	"notes" text,
	"assessmentDate" timestamp DEFAULT now(),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_input_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"sourceType" varchar(64) NOT NULL,
	"weight" numeric(3, 2) NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "le_input_weights_sourceType_unique" UNIQUE("sourceType")
);
--> statement-breakpoint
CREATE TABLE "le_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"problemId" integer,
	"ventureId" integer,
	"leInsightSource" text NOT NULL,
	"sourceId" integer,
	"content" text NOT NULL,
	"evidenceStrength" integer,
	"confidenceScore" numeric(3, 2),
	"tags" text,
	"ipSensitive" boolean DEFAULT false,
	"extractedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_kg_edges" (
	"id" serial PRIMARY KEY NOT NULL,
	"fromNodeId" integer NOT NULL,
	"toNodeId" integer NOT NULL,
	"leEdgeRel" text NOT NULL,
	"weight" numeric(3, 2) DEFAULT '0.50',
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_kg_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"leNodeType" text NOT NULL,
	"label" varchar(256) NOT NULL,
	"ventureId" integer,
	"properties" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_learning_patterns" (
	"id" serial PRIMARY KEY NOT NULL,
	"lePatternType" text NOT NULL,
	"sector" varchar(100),
	"title" varchar(256) NOT NULL,
	"description" text,
	"frequency" integer DEFAULT 1,
	"confidenceScore" numeric(3, 2),
	"supportingData" text,
	"isActive" boolean DEFAULT true,
	"detectedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_problems" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"sector" varchar(100) NOT NULL,
	"frequencyScore" integer,
	"severityScore" integer,
	"customerSegment" varchar(200),
	"context" text,
	"leProblemStatus" text DEFAULT 'active' NOT NULL,
	"ventureId" integer,
	"tags" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" integer NOT NULL,
	"leRecType" text NOT NULL,
	"leRecPriority" text DEFAULT 'medium' NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"actionItems" text,
	"confidence" numeric(3, 2),
	"leRecStatus" text DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "le_vrl_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" integer NOT NULL,
	"trlScore" numeric(4, 2),
	"brlScore" numeric(4, 2),
	"alpha" numeric(3, 2) DEFAULT '0.50',
	"beta" numeric(3, 2) DEFAULT '0.50',
	"riskIndex" numeric(3, 2),
	"confidenceScore" numeric(3, 2),
	"vrlScore" numeric(5, 2),
	"leVrlStage" text DEFAULT 'idea',
	"riskBreakdown" text,
	"calculationMethod" varchar(100) DEFAULT 'multiplicative_dual_risk',
	"notes" text,
	"calculatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_risk_escalations" (
	"id" serial PRIMARY KEY NOT NULL,
	"riskItemId" integer NOT NULL,
	"escalatedBy" varchar(128) NOT NULL,
	"reason" text,
	"notifiedAt" timestamp DEFAULT now() NOT NULL,
	"resolvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_risk_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"riskArea" varchar(128) NOT NULL,
	"description" text,
	"riskZone" text DEFAULT 'Medium',
	"mitigation" text,
	"linkedLayer" varchar(64),
	"linkedContracts" text,
	"status" text DEFAULT 'Open',
	"owner" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"marketName" varchar(255) NOT NULL,
	"geography" varchar(128) DEFAULT 'Global',
	"tamValue" integer DEFAULT 0,
	"samValue" integer DEFAULT 0,
	"somValue" integer DEFAULT 0,
	"tamUnit" varchar(32) DEFAULT '-M',
	"cagr" double precision DEFAULT 0,
	"marketYear" integer DEFAULT 2025,
	"forecastYear" integer DEFAULT 2030,
	"sourceUrl" text,
	"sourceName" varchar(255),
	"keyDrivers" text,
	"keyBarriers" text,
	"notes" text,
	"aiGenerated" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_timing_signals" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"marketGrowthScore" integer,
	"competitorActivityScore" integer,
	"regulatoryRiskScore" integer,
	"adoptionReadinessScore" integer,
	"externalShockRiskScore" integer,
	"marketSignalSource" varchar(255),
	"marketTimingRiskScore" integer,
	"collectedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketingCampaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"channel" varchar(64) NOT NULL,
	"status" varchar(32) DEFAULT 'Planned' NOT NULL,
	"budget" integer DEFAULT 0,
	"spent" integer DEFAULT 0,
	"leads" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"startDate" varchar(32),
	"endDate" varchar(32),
	"objective" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketingChannelScores" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"channel" varchar(64) NOT NULL,
	"score" integer DEFAULT 0,
	"period" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mediaCoverage" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"outlet" varchar(255) NOT NULL,
	"headline" varchar(512) NOT NULL,
	"url" varchar(512),
	"sentiment" varchar(32) DEFAULT 'neutral',
	"reach" integer DEFAULT 0,
	"publishedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgApprovedSuppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"supplierId" varchar(64),
	"onboardingId" integer,
	"supplierName" varchar(256) NOT NULL,
	"tierLevel" text DEFAULT 'components',
	"capabilities" text,
	"riskRating" text DEFAULT 'medium',
	"performanceScore" double precision DEFAULT 0,
	"qualityScore" double precision DEFAULT 0,
	"deliveryScore" double precision DEFAULT 0,
	"costScore" double precision DEFAULT 0,
	"lastAuditDate" timestamp,
	"nextAuditDate" timestamp,
	"approvalDate" timestamp,
	"approvedBy" varchar(128),
	"status" text DEFAULT 'active',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgContractTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"supplierId" integer,
	"supplierName" varchar(256),
	"contractType" text NOT NULL,
	"clauseChecklist" text,
	"draftText" text,
	"jurisdiction" varchar(128) DEFAULT 'China',
	"effectiveDate" timestamp,
	"expiryDate" timestamp,
	"penaltyClause" boolean DEFAULT false,
	"ipOwnershipClause" boolean DEFAULT false,
	"incoterms" text DEFAULT 'FOB',
	"status" text DEFAULT 'draft',
	"signedDate" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgFactoryAudits" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"supplierId" integer,
	"supplierName" varchar(256) NOT NULL,
	"auditDate" timestamp,
	"auditorName" varchar(128),
	"facilityCondition" text DEFAULT 'na',
	"equipmentCapability" text DEFAULT 'na',
	"workforceSkills" text DEFAULT 'na',
	"qcProcesses" text DEFAULT 'na',
	"healthAndSafety" text DEFAULT 'na',
	"environmentalCompliance" text DEFAULT 'na',
	"overallResult" text DEFAULT 'pending',
	"auditScore" integer DEFAULT 0,
	"findings" text,
	"correctiveActions" text,
	"followUpDate" timestamp,
	"status" text DEFAULT 'scheduled',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgLogisticsShipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"shipmentRef" varchar(128),
	"freightType" text DEFAULT 'sea' NOT NULL,
	"originPort" text DEFAULT 'shenzhen',
	"destinationPort" varchar(128) DEFAULT 'Felixstowe, UK',
	"volume" integer,
	"weightKg" double precision,
	"freightCostGbp" double precision,
	"dutiesGbp" double precision,
	"insuranceGbp" double precision,
	"leadTimeDays" integer,
	"departureDate" timestamp,
	"arrivalDate" timestamp,
	"status" text DEFAULT 'planned',
	"trackingRef" varchar(128),
	"forwarder" varchar(128),
	"incoterms" text DEFAULT 'FOB',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgPlaybookProjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"productName" varchar(256) NOT NULL,
	"description" text,
	"phase" text DEFAULT 'uk_prototype' NOT NULL,
	"ukPrototypeDone" integer DEFAULT 0,
	"chinaFeasibilityDone" integer DEFAULT 0,
	"pilotProductionDone" integer DEFAULT 0,
	"scaleManufacturingDone" integer DEFAULT 0,
	"trlLevel" integer DEFAULT 1,
	"prototypeStatus" text DEFAULT 'not_started',
	"validationNotes" text,
	"rfqSent" integer DEFAULT 0,
	"dfmComplete" integer DEFAULT 0,
	"toolingOwnershipAgreement" integer DEFAULT 0,
	"pilotVolume" integer DEFAULT 0,
	"scaleVolume" integer DEFAULT 0,
	"targetUnitCostGbp" double precision,
	"materialCostGbp" double precision,
	"labourCostGbp" double precision,
	"overheadCostGbp" double precision,
	"logisticsCostGbp" double precision,
	"marginPercent" double precision DEFAULT 30,
	"iso9001" integer DEFAULT 0,
	"iso14001" integer DEFAULT 0,
	"ceCertified" integer DEFAULT 0,
	"ukcaCertified" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgQcReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"reportType" text NOT NULL,
	"inspectionDate" timestamp,
	"inspector" varchar(128),
	"supplierId" integer,
	"sampleSize" integer,
	"defectsFound" integer DEFAULT 0,
	"aqlLevel" varchar(16) DEFAULT '2.5',
	"result" text DEFAULT 'pending',
	"iso9001Pass" integer DEFAULT 0,
	"iso14001Pass" integer DEFAULT 0,
	"cePass" integer DEFAULT 0,
	"ukcastPass" integer DEFAULT 0,
	"findings" text,
	"correctiveActions" text,
	"attachmentUrl" varchar(512),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgRfqTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"projectId" integer,
	"rfqRef" varchar(64),
	"productName" varchar(256) NOT NULL,
	"productSpecs" text,
	"drawingsUrl" varchar(512),
	"materials" text,
	"targetVolumeMoq" integer,
	"targetVolumeAnnual" integer,
	"targetLeadTimeDays" integer,
	"targetUnitCostGbp" double precision,
	"materialCostGbp" double precision,
	"labourCostGbp" double precision,
	"toolingCostGbp" double precision,
	"overheadCostGbp" double precision,
	"packagingCostGbp" double precision,
	"sentToSuppliers" text,
	"responseDeadline" timestamp,
	"status" text DEFAULT 'draft',
	"awardedSupplier" varchar(256),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgSupplierOnboarding" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"companyName" varchar(256) NOT NULL,
	"location" varchar(256),
	"city" varchar(128),
	"country" varchar(128) DEFAULT 'China',
	"contactName" varchar(128),
	"contactEmail" varchar(256),
	"contactPhone" varchar(64),
	"capabilities" text,
	"certifications" text,
	"productionCapacity" varchar(256),
	"keyClients" text,
	"financialStability" text DEFAULT 'unknown',
	"references" text,
	"technicalCapability" integer DEFAULT 0,
	"qualitySystems" integer DEFAULT 0,
	"leadTimesScore" integer DEFAULT 0,
	"costCompetitiveness" integer DEFAULT 0,
	"communication" integer DEFAULT 0,
	"complianceStandards" integer DEFAULT 0,
	"overallScore" double precision DEFAULT 0,
	"status" text DEFAULT 'pending',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfgSupplierTiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"supplierName" varchar(256) NOT NULL,
	"tier" text NOT NULL,
	"country" varchar(64) DEFAULT 'China',
	"city" varchar(128),
	"contactName" varchar(128),
	"contactEmail" varchar(256),
	"nnnAgreement" text DEFAULT 'none',
	"manufacturingContract" text DEFAULT 'none',
	"toolingOwnership" text DEFAULT 'none',
	"blackBoxComponents" integer DEFAULT 0,
	"riskScore" integer DEFAULT 50,
	"auditScore" integer DEFAULT 0,
	"qualityScore" integer DEFAULT 0,
	"isDualSource" integer DEFAULT 0,
	"primarySupplierId" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"label" varchar(255) NOT NULL,
	"completed" boolean DEFAULT false,
	"targetDate" varchar(32),
	"completedAt" timestamp,
	"sortOrder" integer DEFAULT 0,
	"offeringId" varchar(36),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mitigation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"riskId" integer NOT NULL,
	"actionDescription" text NOT NULL,
	"owner" varchar(128),
	"status" text DEFAULT 'Identified' NOT NULL,
	"revisedSeverity" integer DEFAULT 5,
	"revisedOccurrence" integer DEFAULT 5,
	"revisedDetection" integer DEFAULT 5,
	"revisedRpn" integer DEFAULT 125,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_assessments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"mrlLevel" integer NOT NULL,
	"mrlLabel" varchar(64) NOT NULL,
	"trlLevel" integer,
	"pdeScore" integer,
	"scieScore" integer,
	"csmScore" integer,
	"qceScore" integer,
	"silScore" integer,
	"compositeScore" integer,
	"vrlContribution" double precision,
	"riskScoreOverall" integer,
	"mrlRiskRag" text DEFAULT 'AMBER',
	"mrlRegion" text DEFAULT 'HYBRID',
	"notes" text,
	"assessedBy" varchar(128),
	"assessedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_compliance_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" varchar(36),
	"standard" varchar(128) NOT NULL,
	"market" varchar(64) NOT NULL,
	"mrlComplianceCat" text DEFAULT 'Quality Management',
	"mrlComplianceStatus" text DEFAULT 'Not Started',
	"gapSummary" text,
	"certificationBody" varchar(255),
	"targetCertDate" date,
	"actualCertDate" date,
	"expiryDate" date,
	"estimatedCostGbp" double precision,
	"estimatedWeeks" integer,
	"isOnCriticalPath" boolean DEFAULT false,
	"qualityKpis" json,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_cost_models" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" varchar(36),
	"modelName" varchar(255) NOT NULL,
	"mrlCostRegion" text DEFAULT 'HYBRID',
	"volumeScenarios" json NOT NULL,
	"targetVolume" integer,
	"unitCostGbp" double precision,
	"unitPriceGbp" double precision,
	"grossMarginPct" double precision,
	"breakEvenVolume" integer,
	"capexGbp" double precision,
	"opexAnnualGbp" double precision,
	"capexOpexRatio" double precision,
	"labourRates" json,
	"sensitivityFactors" json,
	"csmScore" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_lcsa_records" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" varchar(36),
	"carbonScope1" double precision,
	"carbonScope2" double precision,
	"carbonScope3" double precision,
	"carbonIntensityPerUnit" double precision,
	"lcsaScore" integer,
	"circularityIndex" double precision,
	"socialRiskIndex" double precision,
	"facilityEnergyMix" json,
	"mrlCbamExposure" text DEFAULT 'None',
	"cbamEstimatedCostGbp" double precision,
	"sectorBenchmarkScore" integer,
	"silScore" integer,
	"notes" text,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_level_defs" (
	"level" integer PRIMARY KEY NOT NULL,
	"label" varchar(64) NOT NULL,
	"trlAlignment" varchar(16),
	"description" text NOT NULL,
	"keyActivities" json,
	"exitCriteria" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_process_routes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" varchar(36),
	"routeName" varchar(255) NOT NULL,
	"operations" json NOT NULL,
	"toolingSpecs" json,
	"bottleneckNodes" json,
	"targetVolumePerYear" integer,
	"cycleTimeModelSec" integer,
	"pdeScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_risk_register" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentId" varchar(36),
	"mrlRiskCat" text NOT NULL,
	"description" text NOT NULL,
	"mrlRag" text NOT NULL,
	"probability" integer NOT NULL,
	"impact" integer NOT NULL,
	"riskScore" integer NOT NULL,
	"mrlRiskPriority" text DEFAULT 'MED',
	"mitigationAction" text,
	"mitigationOwner" varchar(128),
	"targetResolutionDate" date,
	"mrlRiskStatus" text DEFAULT 'Open',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mrl_suppliers" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"mrlSupplierTier" text DEFAULT 'T1',
	"country" varchar(64) NOT NULL,
	"mrlSupplierRegion" text DEFAULT 'CN',
	"category" varchar(128),
	"bomComponents" json,
	"riskScore" integer DEFAULT 0,
	"mrlScieRag" text DEFAULT 'AMBER',
	"isSingleSource" boolean DEFAULT false,
	"hasDualSource" boolean DEFAULT false,
	"leadTimeWeeks" integer,
	"moqUnits" integer,
	"mrlFxExposure" text DEFAULT 'MED',
	"mrlGeoRisk" text DEFAULT 'LOW',
	"mrlAuditStatus" text DEFAULT 'Not Audited',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletterCampaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"previewText" varchar(255),
	"status" varchar(32) DEFAULT 'Draft' NOT NULL,
	"scheduledAt" timestamp,
	"sentAt" timestamp,
	"recipients" integer DEFAULT 0,
	"openRate" integer DEFAULT 0,
	"clickRate" integer DEFAULT 0,
	"unsubscribes" integer DEFAULT 0,
	"contentUrl" varchar(512),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringAnalyticsLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"marketAnalysisId" integer,
	"reportId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringCrmLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"pipelineId" integer,
	"dealId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringExperimentLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"experimentId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringFinancialModels" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"modelName" varchar(128) DEFAULT 'Base Case' NOT NULL,
	"revenueYear1" numeric(14, 2),
	"revenueYear2" numeric(14, 2),
	"revenueYear3" numeric(14, 2),
	"cogsPercent" double precision,
	"opexMonthly" numeric(12, 2),
	"breakEvenMonth" integer,
	"fundingRequired" numeric(14, 2),
	"assumptions" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringKpiSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"snapshotDate" date NOT NULL,
	"revenue" numeric(14, 2),
	"cogs" numeric(14, 2),
	"grossMargin" double precision,
	"unitsSold" integer,
	"activeCustomers" integer,
	"cac" numeric(10, 2),
	"ltv" numeric(10, 2),
	"nps" integer,
	"trlAtSnapshot" integer,
	"brlAtSnapshot" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringMilestoneLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"milestoneId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringResearchLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"researchProjectId" integer NOT NULL,
	"offeringResearchLinkType" text DEFAULT 'supporting',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringRevenueLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"snapshotId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringRiskLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"riskId" integer NOT NULL,
	"offeringRiskType" text DEFAULT 'venture',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringSupplyChainLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"projectId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offeringWorkflowLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"triggerLogId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offerings" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"portfolioId" varchar(64) NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"offeringType" text DEFAULT 'Physical Product',
	"offeringStatus" text DEFAULT 'Concept',
	"trl" integer DEFAULT 1,
	"brlScore" integer DEFAULT 0,
	"revenueModel" text DEFAULT 'B2B',
	"targetSegment" text,
	"pricePoint" numeric(12, 2),
	"currency" varchar(8) DEFAULT 'GBP',
	"launchDate" date,
	"color" varchar(32) DEFAULT '#3A97D3',
	"logoUrl" text,
	"tags" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_hypotheses" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"onboardingStep" integer NOT NULL,
	"taskLabel" varchar(255) NOT NULL,
	"hypothesis" text NOT NULL,
	"validationCriterion" text NOT NULL,
	"minimumSampleSize" integer,
	"outcome" text DEFAULT 'Pending',
	"evidenceSummary" text,
	"validatedAt" timestamp,
	"linkedExperimentIds" text,
	"linkedInterviewIds" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"problemStatement" text,
	"sector" varchar(128),
	"marketSizeScore" integer DEFAULT 0,
	"strategicFitScore" integer DEFAULT 0,
	"esgAlignmentScore" integer DEFAULT 0,
	"founderAvailScore" integer DEFAULT 0,
	"totalScore" integer DEFAULT 0,
	"status" text DEFAULT 'Identified',
	"convertedToVentureId" varchar(64),
	"submittedBy" varchar(128),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_disruption_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunityId" integer NOT NULL,
	"initialMarketSmallness" integer DEFAULT 0,
	"nonConsumerTargeting" integer DEFAULT 0,
	"simplicityScore" integer DEFAULT 0,
	"lowMarginViability" integer DEFAULT 0,
	"incumbentIgnoreScore" integer DEFAULT 0,
	"disruptionPotentialScore" integer DEFAULT 0,
	"requiresDifferentCostStructure" boolean DEFAULT false,
	"requiresDifferentChannel" boolean DEFAULT false,
	"requiresDifferentCustomerRelationship" boolean DEFAULT false,
	"autonomousTeamFlagged" boolean DEFAULT false,
	"assessmentNotes" text,
	"assessedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opportunity_disruption_scores_opportunityId_unique" UNIQUE("opportunityId")
);
--> statement-breakpoint
CREATE TABLE "opportunity_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"opportunityId" integer NOT NULL,
	"title" varchar(512) NOT NULL,
	"problemStatement" text NOT NULL,
	"reportContent" text,
	"marketSizeSummary" text,
	"competitorSummary" text,
	"keyInsights" text,
	"recommendedAction" text DEFAULT 'Investigate Further',
	"confidenceScore" integer DEFAULT 5,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunity_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"reviewerName" varchar(128) NOT NULL,
	"reviewerRole" varchar(128),
	"decision" text NOT NULL,
	"rationale" text,
	"conditionsForApproval" text,
	"reviewedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patent_hypotheses" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"rationale" text,
	"claimImpact" text,
	"included" boolean DEFAULT false,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patent_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"ipAssetId" integer,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(256) NOT NULL,
	"phase" varchar(32) DEFAULT 'Ingestion' NOT NULL,
	"coreInventionNotes" text,
	"priorArtNotes" text,
	"draftAbstract" text,
	"draftBackground" text,
	"draftSummary" text,
	"draftDetailedDesc" text,
	"draftClaims" text,
	"jurisdiction" varchar(64) DEFAULT 'UK/EPO',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pb_kpi_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" integer NOT NULL,
	"runId" integer,
	"kpiLabel" varchar(300) NOT NULL,
	"targetValue" varchar(100),
	"actualValue" varchar(100),
	"unit" varchar(50),
	"achieved" boolean,
	"measuredAt" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pb_linked_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" integer NOT NULL,
	"assetName" varchar(200) NOT NULL,
	"pbAssetType" text NOT NULL,
	"assetRef" varchar(500),
	"domain" varchar(100),
	"pbClassification" text,
	"pbZone" text,
	"dqsCurrent" numeric(5, 2),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pb_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" varchar(20) NOT NULL,
	"title" varchar(200) NOT NULL,
	"subFolder" text NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"ownerRole" varchar(100),
	"strategicPrinciple" text,
	"triggerConditions" text,
	"kpis" text,
	"pbStatus" text DEFAULT 'draft' NOT NULL,
	"lastRun" timestamp,
	"runCount" integer DEFAULT 0 NOT NULL,
	"linkedAssetIds" text,
	"ventureId" varchar(100),
	"createdBy" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pb_playbooks_playbookId_unique" UNIQUE("playbookId")
);
--> statement-breakpoint
CREATE TABLE "pb_run_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"runId" integer NOT NULL,
	"stepId" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"pbRunStepStatus" text DEFAULT 'pending' NOT NULL,
	"assignedTo" varchar(255),
	"startedAt" timestamp,
	"completedAt" timestamp,
	"notes" text,
	"evidence" text,
	"blockerReason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pb_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" integer NOT NULL,
	"ventureId" varchar(100),
	"triggeredBy" varchar(255),
	"triggerReason" varchar(500),
	"pbRunStatus" text DEFAULT 'pending' NOT NULL,
	"currentStep" integer DEFAULT 1 NOT NULL,
	"totalSteps" integer DEFAULT 0 NOT NULL,
	"startedAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp,
	"notes" text,
	"aiSummary" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pb_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" integer NOT NULL,
	"stepNumber" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"action" text NOT NULL,
	"assigneeRole" varchar(100),
	"slaDays" integer,
	"toolsRequired" text,
	"outputArtifact" varchar(200),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pcf_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"scope1Emissions" double precision DEFAULT 0,
	"scope2Emissions" double precision DEFAULT 0,
	"scope3Emissions" double precision DEFAULT 0,
	"totalEmissions" double precision DEFAULT 0,
	"emissionIntensity" double precision,
	"baselineYear" integer,
	"baselineEmissions" double precision,
	"targetYear" integer,
	"targetReductionPercent" double precision,
	"netZeroCommitment" boolean DEFAULT false,
	"scienceBasedTarget" boolean DEFAULT false,
	"offsetsUsed" double precision DEFAULT 0,
	"offsetProvider" varchar(128),
	"pcfScore" double precision DEFAULT 0,
	"measurementStandard" varchar(128),
	"lastMeasuredAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pcf_records_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "people_venture_fit" (
	"id" serial PRIMARY KEY NOT NULL,
	"talentProfileId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"roleRequirementId" integer,
	"skillsMatch" double precision DEFAULT 0,
	"industryMatch" double precision DEFAULT 0,
	"stageMatch" double precision DEFAULT 0,
	"networkValue" double precision DEFAULT 0,
	"availabilityFit" double precision DEFAULT 0,
	"pvfScore" double precision DEFAULT 0,
	"recommendation" text DEFAULT 'Possible',
	"notes" text,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"technicalCapabilityScore" integer DEFAULT 1,
	"efficiencyScore" integer DEFAULT 1,
	"functionalityScore" integer DEFAULT 1,
	"performanceScore" double precision DEFAULT 0,
	"performanceGapDescription" text,
	"innovationOpportunity" text,
	"assessedBy" varchar(128),
	"assessedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pivot_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"decisionDate" timestamp NOT NULL,
	"decision" text NOT NULL,
	"pivotType" text,
	"hypothesisTested" text NOT NULL,
	"evidenceSummary" text,
	"experimentsPassed" integer DEFAULT 0,
	"experimentsFailed" integer DEFAULT 0,
	"interviewsReviewed" integer DEFAULT 0,
	"vrlScoreAtDecision" double precision,
	"newHypothesis" text,
	"rationale" text,
	"decidedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pivot_runway_inputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"currentCashBalance" integer DEFAULT 0,
	"monthlyBurnRate" integer DEFAULT 0,
	"avgPivotCostEstimate" integer DEFAULT 0,
	"avgPivotDurationWeeks" integer DEFAULT 8,
	"estimatedRunwayMonths" double precision,
	"estimatedPivotsRemaining" double precision,
	"runwayAlertThreshold" integer DEFAULT 2,
	"runwayAlertActive" boolean DEFAULT false,
	"lastCalculatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pivot_runway_inputs_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "pivot_trigger_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"minExperimentPassRatePct" double precision DEFAULT 30,
	"maxRiskIndexPct" double precision DEFAULT 60,
	"minVrlScore" double precision DEFAULT 2,
	"stagnationPeriodDays" integer DEFAULT 60,
	"alertActive" boolean DEFAULT false,
	"alertTriggeredAt" timestamp,
	"alertDismissedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pivot_trigger_config_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "playbook_completions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"playbookId" varchar(64) NOT NULL,
	"userId" integer NOT NULL,
	"ventureId" varchar(64),
	"module" varchar(128),
	"workflowStage" varchar(64),
	"completionStatus" text DEFAULT 'Not Started',
	"completedSteps" text,
	"evidenceLinks" text,
	"completedAt" integer,
	"reviewedBy" varchar(128),
	"reviewStatus" text DEFAULT 'Not Required',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_context_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"ruleName" varchar(128) NOT NULL,
	"description" text,
	"playbookId" varchar(64) NOT NULL,
	"module" varchar(128),
	"page" varchar(128),
	"workflowStage" varchar(64),
	"rdStage" varchar(64),
	"scoringFramework" varchar(64),
	"missingEvidenceTrigger" boolean DEFAULT false,
	"highRiskTrigger" boolean DEFAULT false,
	"lowScoreTrigger" boolean DEFAULT false,
	"stageGateTrigger" boolean DEFAULT false,
	"investorWarningTrigger" boolean DEFAULT false,
	"allowedRoles" text,
	"priority" integer DEFAULT 50,
	"adminPriority" integer DEFAULT 50,
	"suppressIfCompleted" boolean DEFAULT true,
	"allowRepeatRecommendation" boolean DEFAULT false,
	"minimumRecommendationScore" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"updatedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(128) NOT NULL,
	"relatedModule" varchar(128),
	"relatedWorkflowStage" varchar(128),
	"userRole" varchar(255),
	"purpose" text,
	"whenToUse" text,
	"stepByStepGuidance" text,
	"requiredInputs" text,
	"requiredOutputs" text,
	"linkedTemplates" text,
	"linkedScoringFrameworks" text,
	"linkedRiskCategories" text,
	"evidenceRequired" text,
	"completionChecklist" text,
	"approvalRequired" boolean DEFAULT false,
	"playbookAccessLevel" text DEFAULT 'Internal Team' NOT NULL,
	"version" varchar(16) DEFAULT '1.0' NOT NULL,
	"playbookStatus" text DEFAULT 'Draft' NOT NULL,
	"owner" varchar(128),
	"reviewDate" varchar(32),
	"createdBy" varchar(128),
	"updatedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "playbook_library_playbookId_unique" UNIQUE("playbookId")
);
--> statement-breakpoint
CREATE TABLE "playbook_usage_events" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"eventType" varchar(64) NOT NULL,
	"playbookId" varchar(64),
	"widgetType" varchar(64),
	"userId" integer,
	"ventureId" varchar(64),
	"module" varchar(128),
	"page" varchar(128),
	"contextRuleId" integer,
	"recommendationScore" integer,
	"actionType" varchar(64),
	"contextSnapshot" text,
	"outcome" varchar(128),
	"dismissedReason" text,
	"createdAt" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"playbookDbId" integer NOT NULL,
	"version" varchar(16) NOT NULL,
	"snapshot" text NOT NULL,
	"changedBy" varchar(128),
	"changeNote" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playbook_widget_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" varchar(128) NOT NULL,
	"widgetType" varchar(64) NOT NULL,
	"isEnabled" boolean DEFAULT true,
	"maxPlaybooks" integer DEFAULT 3,
	"threshold" integer DEFAULT 40,
	"position" text DEFAULT 'sidebar',
	"updatedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"portfolioType" text DEFAULT 'Mixed',
	"portfolioStatus" text DEFAULT 'Pre-Launch',
	"color" varchar(32) DEFAULT '#51AF37',
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pressReleases" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"status" varchar(32) DEFAULT 'Draft' NOT NULL,
	"publishedAt" timestamp,
	"mediaOutlets" text,
	"coverageLinks" text,
	"reach" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prl_trend_alerts" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"founderId" integer NOT NULL,
	"ventureId" varchar(64),
	"alertType" text NOT NULL,
	"severity" text DEFAULT 'warning' NOT NULL,
	"message" text NOT NULL,
	"weekOf" date NOT NULL,
	"prlScore" numeric(5, 2),
	"prlDelta" numeric(5, 2),
	"acknowledged" boolean DEFAULT false NOT NULL,
	"acknowledgedAt" timestamp,
	"acknowledgedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_baselines" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"manufacturingCost" double precision,
	"supplyChainCost" double precision,
	"lifecycleCost" double precision,
	"technicalCapability" text,
	"efficiencyRating" double precision,
	"reliabilityScore" double precision,
	"durabilityYears" double precision,
	"carbonFootprintKg" double precision,
	"esgComplianceLevel" text DEFAULT 'None',
	"circularityScore" double precision,
	"baselineSource" varchar(255),
	"baselineDate" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"sector" varchar(128),
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_opportunities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"categoryId" integer,
	"sector" varchar(128),
	"targetMarket" varchar(255),
	"productStage" text DEFAULT 'Concept',
	"status" text DEFAULT 'Identified',
	"convertedToVentureId" varchar(64),
	"submittedBy" varchar(128),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_opportunity_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"costScore" double precision DEFAULT 0,
	"performanceScore" double precision DEFAULT 0,
	"qualityScore" double precision DEFAULT 0,
	"sustainabilityScore" double precision DEFAULT 0,
	"posScore" double precision DEFAULT 0,
	"posClassification" text DEFAULT 'Low Opportunity',
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_opportunity_scores_productOpportunityId_unique" UNIQUE("productOpportunityId")
);
--> statement-breakpoint
CREATE TABLE "product_readiness_levels" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"trlLevel" integer NOT NULL,
	"mrlLevel" integer NOT NULL,
	"mrlComposite" integer,
	"trlWeight" double precision DEFAULT 0.5 NOT NULL,
	"mrlWeight" double precision DEFAULT 0.5 NOT NULL,
	"prlScore" double precision NOT NULL,
	"prlLevel" integer NOT NULL,
	"prlLabel" varchar(64),
	"vrlContribution" double precision,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"computedBy" varchar(128),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_risk_inputs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"sourceType" text DEFAULT 'manual' NOT NULL,
	"inputCategory" text DEFAULT 'Founder' NOT NULL,
	"technicalFeasibilityScore" double precision DEFAULT 50,
	"prototypeMaturity" double precision DEFAULT 50,
	"technologyReadiness" double precision DEFAULT 50,
	"performanceRiskScore" double precision DEFAULT 50,
	"benchmarkGap" double precision DEFAULT 50,
	"qualityRisk" double precision DEFAULT 50,
	"reliabilityRisk" double precision DEFAULT 50,
	"scalabilityRiskScore" double precision DEFAULT 50,
	"manufacturingRisk" double precision DEFAULT 50,
	"supplyChainRisk" double precision DEFAULT 50,
	"unitCostScalability" double precision DEFAULT 50,
	"engineeringComplexity" double precision DEFAULT 50,
	"integrationRisk" double precision DEFAULT 50,
	"dependencyRisk" double precision DEFAULT 50,
	"rdMaturityScore" double precision DEFAULT 50,
	"labValidationScore" double precision DEFAULT 50,
	"pilotTestScore" double precision DEFAULT 50,
	"executionTrack" text DEFAULT 'ECORACE',
	"productRiskIndex" double precision DEFAULT 50,
	"notes" text,
	"lastUpdatedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_risk_inputs_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "quality_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"reliabilityScore" integer DEFAULT 1,
	"durabilityScore" integer DEFAULT 1,
	"userExperienceScore" integer DEFAULT 1,
	"qualityScore" double precision DEFAULT 0,
	"qualityGapDescription" text,
	"improvementOpportunity" text,
	"assessedBy" varchar(128),
	"assessedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_delivery_log" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"reportId" varchar(64) NOT NULL,
	"founderId" integer NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"sentBy" varchar(128),
	"channel" text DEFAULT 'notification' NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"errorMessage" text,
	"notificationId" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "research_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(512) NOT NULL,
	"authors" text NOT NULL,
	"journal" varchar(255),
	"year" integer,
	"doi" varchar(255),
	"url" text,
	"abstract" text,
	"keywords" text,
	"category" text DEFAULT 'Other',
	"evidenceType" text DEFAULT 'Peer Reviewed',
	"relevanceScore" integer DEFAULT 5,
	"ventureIds" text,
	"trlLevelsSupported" text,
	"vrlStagesSupported" text,
	"notes" text,
	"addedBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_model_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"revenueModelType" varchar(128),
	"pricingValidated" boolean DEFAULT false,
	"grossMarginAssumption" integer,
	"unitEconomicsScore" integer,
	"repeatabilityScore" integer,
	"scalabilityScore" integer,
	"revenueConfidenceScore" integer,
	"riskScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riskRegister" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64),
	"title" varchar(512) NOT NULL,
	"category" text DEFAULT 'operational' NOT NULL,
	"likelihood" integer DEFAULT 3,
	"impact" integer DEFAULT 3,
	"riskScore" integer,
	"status" text DEFAULT 'open',
	"owner" varchar(255),
	"mitigationPlan" text,
	"residualRisk" integer,
	"reviewDate" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"domain" varchar(64) NOT NULL,
	"level" text DEFAULT 'Medium',
	"mitigation" text,
	"offeringId" varchar(36),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sc_manufacturing" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"bomJson" text,
	"bomVersion" varchar(32) DEFAULT '1.0',
	"unitCostGbp" double precision,
	"toolingCostGbp" double precision,
	"moq" integer DEFAULT 1,
	"targetUnitCostGbp" double precision,
	"primaryProcess" text DEFAULT 'composite_layup',
	"processComplexityIndex" integer DEFAULT 50,
	"productionCapacityPerMonth" integer,
	"leadTimeDays" integer,
	"manufacturingReadinessScore" integer DEFAULT 0,
	"readinessNotes" text,
	"toolingStatus" text DEFAULT 'not_started',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sc_production_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"productId" integer NOT NULL,
	"supplierId" integer,
	"orderRef" varchar(64),
	"orderType" text DEFAULT 'pilot',
	"geography" text DEFAULT 'China',
	"quantityOrdered" integer NOT NULL,
	"unitCostGbp" double precision,
	"totalCostGbp" double precision,
	"orderDate" timestamp DEFAULT now(),
	"expectedDeliveryDate" timestamp,
	"actualDeliveryDate" timestamp,
	"leadTimeDays" integer,
	"qaStatus" text DEFAULT 'pending',
	"defectRate" double precision DEFAULT 0,
	"qualityNotes" text,
	"shippingMethod" text DEFAULT 'sea',
	"trackingRef" varchar(128),
	"status" text DEFAULT 'draft',
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sc_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" text,
	"materialType" text DEFAULT 'carbon_fibre',
	"manufacturingProcess" text DEFAULT 'composite_layup',
	"prototypeStatus" text DEFAULT 'concept',
	"trlLevel" integer DEFAULT 1,
	"productionGeography" text DEFAULT 'UK',
	"targetMarket" varchar(256),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sc_prototypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"version" varchar(32) DEFAULT 'v1',
	"cadStatus" text DEFAULT 'not_started',
	"caeStatus" text DEFAULT 'not_started',
	"cadFileUrl" varchar(512),
	"labTestStatus" text DEFAULT 'not_started',
	"testResults" text,
	"structuralIntegrity" double precision,
	"weightGrams" double precision,
	"dimensionsMm" varchar(128),
	"trlAtStart" integer DEFAULT 1,
	"trlAtEnd" integer DEFAULT 1,
	"lcaScore" double precision,
	"carbonFootprintKg" double precision,
	"manufacturingNotes" text,
	"prototypeImageUrl" varchar(512),
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sc_suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"supplierType" text DEFAULT 'contract_manufacturer',
	"geography" text DEFAULT 'China',
	"city" varchar(128),
	"contactName" varchar(128),
	"contactEmail" varchar(256),
	"riskScore" integer DEFAULT 50,
	"qualityScore" integer DEFAULT 50,
	"leadTimeDays" integer,
	"unitCostIndex" double precision,
	"esgComplianceStatus" text DEFAULT 'unknown',
	"ethicalSourcingScore" integer DEFAULT 50,
	"geopoliticalRiskFlag" boolean DEFAULT false,
	"geopoliticalNotes" text,
	"contractStatus" text DEFAULT 'prospect',
	"certifications" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_category_results" (
	"resultId" varchar(36) PRIMARY KEY NOT NULL,
	"sessionId" varchar(36) NOT NULL,
	"category" varchar(30) NOT NULL,
	"scoreS" numeric(6, 4) NOT NULL,
	"maturityM" numeric(4, 2) NOT NULL,
	"weightW" numeric(4, 2) NOT NULL,
	"contribution" numeric(8, 4) NOT NULL,
	"maturityLabel" varchar(20) NOT NULL,
	"indicatorScores" json NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_datasets" (
	"datasetId" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"sector" varchar(80) NOT NULL,
	"description" text,
	"indicatorScores" json NOT NULL,
	"maturityScores" json NOT NULL,
	"isDemo" boolean DEFAULT true NOT NULL,
	"expectedMrlLevel" integer,
	"expectedGateLocked" boolean,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_sessions" (
	"sessionId" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(36),
	"ventureName" varchar(120),
	"mrlScore" numeric(5, 1) NOT NULL,
	"mrlScoreRaw" numeric(5, 1) NOT NULL,
	"mrlLevel" integer NOT NULL,
	"mrlLabel" varchar(40) NOT NULL,
	"confidenceBand" numeric(5, 2) NOT NULL,
	"gateLocked" boolean DEFAULT false NOT NULL,
	"gateReason" text,
	"schemaVersion" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"scoredBy" varchar(36),
	"assessmentType" varchar(20) DEFAULT 'manual' NOT NULL,
	"snapshotHash" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialistCommissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"specialistId" integer NOT NULL,
	"serviceTaskId" integer,
	"title" varchar(255) NOT NULL,
	"brief" text,
	"status" varchar(32) DEFAULT 'Open' NOT NULL,
	"budget" numeric(10, 2),
	"agreedFee" numeric(10, 2),
	"platformFee" numeric(10, 2),
	"startDate" timestamp,
	"dueDate" timestamp,
	"completedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialistServiceTasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(128) NOT NULL,
	"priority" varchar(32) DEFAULT 'Medium' NOT NULL,
	"status" varchar(32) DEFAULT 'Open' NOT NULL,
	"brlStage" integer DEFAULT 1,
	"estimatedHrs" numeric(6, 1),
	"assignedTo" integer,
	"dueDate" timestamp,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specialists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(255) NOT NULL,
	"category" varchar(128) NOT NULL,
	"rate" varchar(64) DEFAULT 'TBD' NOT NULL,
	"availability" varchar(32) DEFAULT 'Available' NOT NULL,
	"rating" numeric(3, 1) DEFAULT '5.0',
	"completedJobs" integer DEFAULT 0,
	"bio" text,
	"skills" text,
	"portfolioUrl" varchar(512),
	"linkedinUrl" varchar(512),
	"isVerified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spinoff_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequenceId" integer NOT NULL,
	"spinoffAssetType" text NOT NULL,
	"sourceModule" varchar(300),
	"destPath" varchar(300),
	"spinoffAssetStatus" text DEFAULT 'pending' NOT NULL,
	"driveUrl" varchar(500),
	"notes" text,
	"migratedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "spinoff_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"founderProfileIds" text NOT NULL,
	"proposedVentureName" varchar(128),
	"proposedTagline" text,
	"proposedSector" varchar(128),
	"proposedChannel" text DEFAULT 'B2B',
	"proposedBrandColor" varchar(32) DEFAULT '#22c55e',
	"strategicClassification" text DEFAULT 'Sustaining',
	"engineOfGrowth" text,
	"estimatedBurnRateMonthly" integer DEFAULT 0,
	"estimatedRunwayMonths" integer DEFAULT 12,
	"fundingAskAmount" integer DEFAULT 0,
	"nominatedCharity" varchar(255),
	"assignedMentor" varchar(128),
	"vbsSupportLevel" text DEFAULT 'Full Incubation',
	"status" text DEFAULT 'Draft',
	"convertedToVentureId" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spinoff_execution_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"spinoffConfigId" integer NOT NULL,
	"planVersion" integer DEFAULT 1,
	"planTitle" varchar(255),
	"executiveSummary" text,
	"fullPlanMarkdown" text,
	"milestonesJson" text,
	"resourceAllocationJson" text,
	"risksJson" text,
	"kpiFrameworkJson" text,
	"generatedBy" varchar(64) DEFAULT 'llm',
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"reviewedBy" varchar(128),
	"reviewedAt" timestamp,
	"status" text DEFAULT 'Draft',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spinoff_handover_packs" (
	"id" serial PRIMARY KEY NOT NULL,
	"sequenceId" integer NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"executiveSummary" text,
	"operatorPlaybook" text,
	"ninetyDayPlan" text,
	"openRisks" text,
	"keyContacts" json,
	"assetLinks" json,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"approvedAt" timestamp,
	"driveUrl" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "spinoff_sequences" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"ventureCode" varchar(20) NOT NULL,
	"ventureName" varchar(200) NOT NULL,
	"triggerVrlScore" numeric(5, 2) NOT NULL,
	"approvedDate" varchar(30) NOT NULL,
	"founderName" varchar(200),
	"founderEmail" varchar(320),
	"leadInvestorName" varchar(200),
	"spinoffSeqStatus" text DEFAULT 'pending' NOT NULL,
	"currentStep" integer DEFAULT 1 NOT NULL,
	"spinoffDriveUrl" varchar(500),
	"dataRoomUrl" varchar(500),
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spinoff_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"spinoffConfigId" integer NOT NULL,
	"fromStatus" varchar(64),
	"toStatus" varchar(64) NOT NULL,
	"reviewedBy" varchar(128),
	"reason" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spinoutBlueprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"offeringId" varchar(64) NOT NULL,
	"portfolioId" varchar(64) NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"talentScore" integer DEFAULT 0,
	"supplyChainScore" integer DEFAULT 0,
	"financeScore" integer DEFAULT 0,
	"marketScore" integer DEFAULT 0,
	"technologyScore" integer DEFAULT 0,
	"governanceScore" integer DEFAULT 0,
	"overallScore" integer DEFAULT 0,
	"blueprintGateStatus" text DEFAULT 'not_ready',
	"spinoffConfigId" integer,
	"blueprintMarkdown" text,
	"executionRoadmap" text,
	"gapAnalysis" text,
	"reviewedBy" varchar(128),
	"reviewedAt" timestamp,
	"reviewNotes" text,
	"createdBy" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_assessments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"assessmentDate" date NOT NULL,
	"srlStageAtAssmt" text NOT NULL,
	"compositeScore" numeric(5, 2) NOT NULL,
	"srlLevel" integer NOT NULL,
	"scoreDelta" numeric(5, 2),
	"gateRef" varchar(10),
	"srlGateStatus" text,
	"sustainabilityWatch" boolean DEFAULT false NOT NULL,
	"trajectoryBonus" numeric(5, 2) DEFAULT '0.00',
	"weightConfigSnapshot" json NOT NULL,
	"assessedBy" varchar(200) NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"versionNo" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_audit_log" (
	"id" integer PRIMARY KEY NOT NULL,
	"srlAuditEvtType" text NOT NULL,
	"ventureId" varchar(64),
	"actorId" varchar(128) NOT NULL,
	"actorRole" varchar(64),
	"eventTimestamp" timestamp DEFAULT now() NOT NULL,
	"payloadHash" varchar(64) NOT NULL,
	"referenceId" varchar(36),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "srl_data_sources" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"sourceName" varchar(200) NOT NULL,
	"srlSrcType" text NOT NULL,
	"endpointUrl" varchar(500),
	"frequency" varchar(30),
	"dataOwner" varchar(200),
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_dimension_definitions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"srlDimDefCode" text NOT NULL,
	"dimensionName" varchar(100) NOT NULL,
	"description" text,
	"defaultWeight" numeric(5, 4) NOT NULL,
	"sortOrder" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "srl_dimension_definitions_srlDimDefCode_unique" UNIQUE("srlDimDefCode")
);
--> statement-breakpoint
CREATE TABLE "srl_dimension_scores" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"assessmentId" varchar(36) NOT NULL,
	"dimensionId" varchar(36) NOT NULL,
	"srlDimScoreCode" text NOT NULL,
	"rawScore" numeric(5, 2) NOT NULL,
	"weightedScore" numeric(5, 2) NOT NULL,
	"weightApplied" numeric(5, 4) NOT NULL,
	"kpiCoveragePct" numeric(5, 2),
	"gatePass" boolean,
	"gateFloorValue" numeric(5, 2),
	"gapFlags" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_gate_configs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"srlGcCode" text NOT NULL,
	"compositeFloor" numeric(5, 2) NOT NULL,
	"srlBlockType" text NOT NULL,
	"remediationWindowDays" integer NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "srl_gate_configs_srlGcCode_unique" UNIQUE("srlGcCode")
);
--> statement-breakpoint
CREATE TABLE "srl_gate_dimension_floors" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"gateConfigId" varchar(36) NOT NULL,
	"srlGdfDimCode" text NOT NULL,
	"floorValue" numeric(5, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_gate_holding_status" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"srlGhsGate" text NOT NULL,
	"srlGhsStatus" text NOT NULL,
	"firstFailAssessmentId" varchar(36),
	"clearanceAssessmentId" varchar(36),
	"remediationStartDate" date,
	"holdingStartDate" date,
	"clearanceDate" date,
	"restartCount" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_kpi_definitions" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"dimensionId" varchar(36) NOT NULL,
	"kpiCode" varchar(20) NOT NULL,
	"kpiName" varchar(200) NOT NULL,
	"description" text,
	"srlKpiDataType" text NOT NULL,
	"unit" varchar(50) NOT NULL,
	"srlNormMethod" text NOT NULL,
	"normTarget" numeric(18, 4),
	"normMin" numeric(18, 4),
	"normMax" numeric(18, 4),
	"thresholdValue" numeric(18, 4),
	"srlThreshDir" text,
	"isMandatory" boolean DEFAULT false NOT NULL,
	"higherIsBetter" boolean DEFAULT true NOT NULL,
	"sdgTag" varchar(50),
	"griTag" varchar(50),
	"tcfdTag" varchar(50),
	"sasbTag" varchar(50),
	"activatedByTrlLevel" integer,
	"activatedByMrlLevel" integer,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "srl_kpi_definitions_kpiCode_unique" UNIQUE("kpiCode")
);
--> statement-breakpoint
CREATE TABLE "srl_kpi_values" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"dimScoreId" varchar(36) NOT NULL,
	"kpiDefId" varchar(36) NOT NULL,
	"kpiCode" varchar(20) NOT NULL,
	"sourceId" varchar(36) NOT NULL,
	"rawValue" numeric(18, 4),
	"unit" varchar(50) NOT NULL,
	"normalisedValue" numeric(5, 2),
	"periodStart" date,
	"periodEnd" date,
	"submittedBy" varchar(200) NOT NULL,
	"submittedAt" timestamp DEFAULT now() NOT NULL,
	"evidenceRef" varchar(500),
	"isVerified" boolean DEFAULT false NOT NULL,
	"verifier" varchar(200),
	"verificationDate" date,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_portfolios" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"portfolioName" varchar(200) NOT NULL,
	"fundManager" varchar(200),
	"configProfile" json DEFAULT '{}'::json NOT NULL,
	"currencyCode" varchar(3) DEFAULT 'GBP' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_reporting_outputs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"assessmentId" varchar(36) NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"srlReportType" text NOT NULL,
	"srlReportFormat" text NOT NULL,
	"srlReportStandard" text,
	"fileRef" varchar(500),
	"generatedBy" varchar(200) NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"periodStart" date,
	"periodEnd" date,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_venture_profiles" (
	"ventureId" varchar(64) PRIMARY KEY NOT NULL,
	"portfolioId" varchar(36),
	"sectorCode" varchar(50) DEFAULT 'GENERAL' NOT NULL,
	"subSector" varchar(100),
	"srlCurrentStage" text DEFAULT 'S0' NOT NULL,
	"srlCurrentLevel" integer DEFAULT 0,
	"srlCurrentScore" numeric(5, 2) DEFAULT '0.00',
	"countryCode" varchar(2) DEFAULT 'GB' NOT NULL,
	"incorporatedDate" date,
	"sustainabilityWatch" boolean DEFAULT false NOT NULL,
	"watchActivatedAt" timestamp,
	"watchLiftedAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srl_weight_configs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"srlWcDimCode" text NOT NULL,
	"srlWcStage" text NOT NULL,
	"sectorCode" varchar(64) DEFAULT 'default' NOT NULL,
	"weightValue" numeric(5, 4) NOT NULL,
	"effectiveFrom" date NOT NULL,
	"effectiveTo" date,
	"createdBy" varchar(128) DEFAULT 'system' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_gate_evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"reviewId" integer NOT NULL,
	"moduleNumber" varchar(5) NOT NULL,
	"docName" varchar(300) NOT NULL,
	"docUrl" varchar(500),
	"sgEvidenceStatus" text DEFAULT 'missing' NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stage_gate_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"sgTargetStage" text NOT NULL,
	"sgReviewStatus" text DEFAULT 'submitted' NOT NULL,
	"sgRecommendation" text,
	"narrativeMemo" text,
	"evidenceAudit" json,
	"gapList" json,
	"submittedBy" varchar(100),
	"approvedBy" varchar(100),
	"approvedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "startup_failure_risk_scores" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"overallFailureRiskScore" integer DEFAULT 0,
	"cashRunwayRisk" integer DEFAULT 0,
	"customerValidationRisk" integer DEFAULT 0,
	"revenueModelRisk" integer DEFAULT 0,
	"executionVelocityRisk" integer DEFAULT 0,
	"teamCompetencyRisk" integer DEFAULT 0,
	"flexibilityRisk" integer DEFAULT 0,
	"fundingProgressionRisk" integer DEFAULT 0,
	"marketTimingRisk" integer DEFAULT 0,
	"strategicRoadmapRisk" integer DEFAULT 0,
	"riskBand" text DEFAULT 'Green',
	"calculatedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategic_roadmap_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"roadmapExistsBoolean" boolean DEFAULT false,
	"milestoneQualityScore" integer,
	"dependencyRiskScore" integer,
	"stageGateClarityScore" integer,
	"executionPlanCompletenessScore" integer,
	"roadmapRiskScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sustainability_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"productOpportunityId" integer NOT NULL,
	"carbonFootprintScore" integer DEFAULT 1,
	"esgComplianceScore" integer DEFAULT 1,
	"circularityScore" integer DEFAULT 1,
	"sustainabilityScore" double precision DEFAULT 0,
	"sustainabilityGapDescription" text,
	"circularityOpportunity" text,
	"assessedBy" varchar(128),
	"assessedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_assessments" (
	"syncId" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"trl" integer NOT NULL,
	"mrl" integer NOT NULL,
	"delta" integer NOT NULL,
	"psi" numeric(8, 4) NOT NULL,
	"rho" numeric(8, 4) NOT NULL,
	"eta" numeric(6, 4) NOT NULL,
	"vrlPenalty" numeric(6, 4) NOT NULL,
	"adjustedVrl" numeric(5, 2),
	"wStage" numeric(5, 3) NOT NULL,
	"wVelocity" numeric(6, 4) NOT NULL,
	"syncSeverity" text NOT NULL,
	"primaryPath" varchar(40) NOT NULL,
	"domainSupply" numeric(4, 3) DEFAULT '0.500' NOT NULL,
	"domainCost" numeric(4, 3) DEFAULT '0.500' NOT NULL,
	"domainCompliance" numeric(4, 3) DEFAULT '0.500' NOT NULL,
	"actions" json NOT NULL,
	"historySnapshot" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"historyId" varchar(36) PRIMARY KEY NOT NULL,
	"ventureId" varchar(36) NOT NULL,
	"trl" integer NOT NULL,
	"mrl" integer NOT NULL,
	"delta" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_scenarios" (
	"scenarioId" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	"sector" varchar(80) NOT NULL,
	"trl" integer NOT NULL,
	"mrl" integer NOT NULL,
	"domainSupply" numeric(4, 3) NOT NULL,
	"domainCost" numeric(4, 3) NOT NULL,
	"domainCompliance" numeric(4, 3) NOT NULL,
	"history" json NOT NULL,
	"isDemo" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "talent_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(255),
	"linkedIn" varchar(255),
	"location" varchar(128),
	"profileType" text DEFAULT 'Operator' NOT NULL,
	"currentRole" varchar(128),
	"availability" text DEFAULT 'Immediately Available',
	"availabilityHoursPerWeek" integer DEFAULT 0,
	"yearsExperience" integer DEFAULT 0,
	"industryExpertise" text,
	"previousVentures" integer DEFAULT 0,
	"previousExits" integer DEFAULT 0,
	"previousLeadershipRoles" integer DEFAULT 0,
	"stageIdea" integer DEFAULT 0,
	"stageValidation" integer DEFAULT 0,
	"stageBuild" integer DEFAULT 0,
	"stageScale" integer DEFAULT 0,
	"capTechnical" integer DEFAULT 0,
	"capCommercial" integer DEFAULT 0,
	"capOperational" integer DEFAULT 0,
	"capRegulatory" integer DEFAULT 0,
	"capManufacturing" integer DEFAULT 0,
	"capSupplyChain" integer DEFAULT 0,
	"capFinancial" integer DEFAULT 0,
	"capMarketing" integer DEFAULT 0,
	"networkInvestors" integer DEFAULT 0,
	"networkCustomers" integer DEFAULT 0,
	"networkSuppliers" integer DEFAULT 0,
	"networkRegulators" integer DEFAULT 0,
	"networkIndustry" integer DEFAULT 0,
	"attrLeadership" integer DEFAULT 0,
	"attrExecution" integer DEFAULT 0,
	"attrCollaboration" integer DEFAULT 0,
	"attrRiskTolerance" integer DEFAULT 0,
	"attrResilience" integer DEFAULT 0,
	"bio" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_paper_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"taskId" integer NOT NULL,
	"paperId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"relevanceScore" double precision,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_competency_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"founderCapabilityScore" integer,
	"technicalExpertiseScore" integer,
	"commercialExpertiseScore" integer,
	"financialExpertiseScore" integer,
	"leadershipScore" integer,
	"domainExpertiseScore" integer,
	"missingRoles" text,
	"aggregateTeamScore" integer,
	"competencyRiskScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_compositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"talentProfileId" integer NOT NULL,
	"roleRequirementId" integer,
	"assignedRole" varchar(128) NOT NULL,
	"assignmentType" text DEFAULT 'Recommended',
	"engagementType" text DEFAULT 'Full-Time',
	"pvfScore" double precision DEFAULT 0,
	"isFounder" boolean DEFAULT false,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_gap_analysis" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"gapArea" text NOT NULL,
	"severity" text DEFAULT 'Medium',
	"description" text,
	"currentScore" double precision DEFAULT 0,
	"requiredScore" double precision DEFAULT 7,
	"gapScore" double precision DEFAULT 0,
	"status" text DEFAULT 'Open',
	"resolutionNotes" text,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "technology_trajectories" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"mainStreamMarketTrlThreshold" integer DEFAULT 7,
	"lowEndMarketTrlThreshold" integer DEFAULT 4,
	"currentTrl" integer NOT NULL,
	"trlGrowthRatePerQuarter" double precision,
	"quartersToMainstreamEntry" double precision,
	"quartersToLowEndEntry" double precision,
	"alertHorizonQuarters" integer DEFAULT 4,
	"marketEntryAlertActive" boolean DEFAULT false,
	"snapshotDate" timestamp NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_effectiveness_cache" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"templateId" varchar(64) NOT NULL,
	"computedAt" timestamp DEFAULT now() NOT NULL,
	"totalAssigned" integer DEFAULT 0 NOT NULL,
	"totalCompleted" integer DEFAULT 0 NOT NULL,
	"completionRate" numeric(5, 2),
	"avgPrlUplift" numeric(5, 2),
	"avgDaysToComplete" numeric(5, 2),
	"effectivenessScore" numeric(5, 2),
	"rank" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniApprovalReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"offeringId" varchar(64),
	"portfolioId" varchar(64),
	"title" varchar(255) NOT NULL,
	"uniApprovalReportType" text DEFAULT 'syllabus_approval' NOT NULL,
	"uniApprovalStatus" text DEFAULT 'draft' NOT NULL,
	"productRiskOwner" varchar(255),
	"businessRiskOwner" varchar(255),
	"executiveSummary" text,
	"problemStatement" text,
	"researchObjectives" text,
	"methodology" text,
	"validationEvidence" text,
	"academicContribution" text,
	"commercialPotential" text,
	"ethicsStatement" text,
	"ipStatement" text,
	"recommendations" text,
	"aiGenerated" boolean DEFAULT false,
	"aiContent" text,
	"confidenceScore" integer,
	"submittedBy" varchar(255),
	"reviewedBy" varchar(255),
	"approvedBy" varchar(255),
	"submittedAt" integer,
	"reviewedAt" integer,
	"approvedAt" integer,
	"reviewNotes" text,
	"linkedResearchIds" text,
	"linkedPartnerIds" text,
	"linkedTalentIds" text,
	"linkedGovernanceIds" text,
	"h4Stage" text DEFAULT 'problem_definition',
	"vrlStage" integer,
	"trlLevel" integer,
	"brlScore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniDataSources" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"sourceType" varchar(64) DEFAULT 'interview' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"sampleSize" integer,
	"collectionMethod" varchar(255),
	"status" varchar(32) DEFAULT 'planned' NOT NULL,
	"dataUrl" varchar(512),
	"keyInsights" text,
	"aiAnalysisDone" boolean DEFAULT false,
	"aiSummary" text,
	"linkedHypothesis" varchar(255),
	"collectedAt" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniGovernanceDocs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"docType" varchar(64) DEFAULT 'student_agreement' NOT NULL,
	"title" varchar(255) NOT NULL,
	"parties" text,
	"status" varchar(32) DEFAULT 'draft' NOT NULL,
	"signedDate" integer,
	"expiryDate" integer,
	"documentUrl" varchar(512),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniIndustryEngagements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"companyName" varchar(255) NOT NULL,
	"engagementType" varchar(64) DEFAULT 'sponsored_research' NOT NULL,
	"description" text,
	"contactName" varchar(255),
	"contactEmail" varchar(255),
	"value" numeric(12, 2),
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"startDate" integer,
	"endDate" integer,
	"deliverables" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniPartners" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(64) DEFAULT 'university' NOT NULL,
	"country" varchar(100),
	"department" varchar(255),
	"contactName" varchar(255),
	"contactEmail" varchar(255),
	"partnershipType" varchar(64) DEFAULT 'research' NOT NULL,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"startDate" integer,
	"endDate" integer,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniResearchProjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"partnerId" integer,
	"title" varchar(255) NOT NULL,
	"researchType" varchar(64) DEFAULT 'business' NOT NULL,
	"description" text,
	"objective" text,
	"methodology" varchar(128),
	"status" varchar(32) DEFAULT 'planned' NOT NULL,
	"leadResearcher" varchar(255),
	"startDate" integer,
	"endDate" integer,
	"budget" numeric(12, 2),
	"publicationUrl" varchar(512),
	"keyFindings" text,
	"trlImpact" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniRoadmapMilestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"phase" varchar(32) DEFAULT 'setup' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"owner" varchar(255),
	"targetDate" integer,
	"completedDate" integer,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"priority" varchar(16) DEFAULT 'medium' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniTalentRoles" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"partnerId" integer,
	"name" varchar(255) NOT NULL,
	"roleType" varchar(64) DEFAULT 'student' NOT NULL,
	"institution" varchar(255),
	"skills" text,
	"availability" varchar(64) DEFAULT 'part_time',
	"assignedProject" varchar(255),
	"stipend" numeric(10, 2),
	"startDate" integer,
	"endDate" integer,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uniVentureWorkflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"projectName" varchar(255) NOT NULL,
	"stage" varchar(64) DEFAULT 'problem_definition' NOT NULL,
	"problemStatement" text,
	"researchFindings" text,
	"hypothesis" text,
	"validationMethod" varchar(255),
	"validationResult" varchar(64),
	"commercialisationPlan" text,
	"linkedResearchId" integer,
	"stageGatePassed" boolean DEFAULT false,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "university_partnerships" (
	"id" serial PRIMARY KEY NOT NULL,
	"universityName" varchar(255) NOT NULL,
	"country" varchar(128),
	"department" varchar(255),
	"contactName" varchar(128),
	"contactEmail" varchar(320),
	"partnershipType" text DEFAULT 'Research Collaboration',
	"status" text DEFAULT 'Prospective',
	"startDate" varchar(32),
	"endDate" varchar(32),
	"description" text,
	"ventureIds" text,
	"fundingLinked" boolean DEFAULT false,
	"fundingAmount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" text DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "value_networks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"primaryCustomerSegment" text,
	"customerPerformanceMetrics" text,
	"targetGrossMarginPct" double precision,
	"costStructureNotes" text,
	"primaryChannel" varchar(128),
	"channelNotes" text,
	"competitiveAlternatives" text,
	"requiresDifferentCostStructure" boolean DEFAULT false,
	"requiresDifferentChannel" boolean DEFAULT false,
	"requiresDifferentCustomerRelationship" boolean DEFAULT false,
	"autonomousTeamRecommended" boolean DEFAULT false,
	"autonomousTeamNotes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "value_networks_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "venture_cap_table_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"snapshotDate" timestamp DEFAULT now() NOT NULL,
	"triggerEvent" varchar(128),
	"capTableJson" text NOT NULL,
	"totalEquityAllocated" double precision DEFAULT 0,
	"totalDynamicScore" double precision DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"sourceType" text NOT NULL,
	"sourceId" integer NOT NULL,
	"targetType" text NOT NULL,
	"targetId" integer NOT NULL,
	"dependencyType" text DEFAULT 'Finish-to-Start',
	"lagDays" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"programId" integer,
	"phaseId" integer,
	"workstreamId" integer,
	"taskId" integer,
	"milestoneId" integer,
	"title" varchar(255) NOT NULL,
	"documentType" text DEFAULT 'Other',
	"version" varchar(32) DEFAULT '1.0',
	"status" text DEFAULT 'Draft',
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileUrl" text NOT NULL,
	"mimeType" varchar(128),
	"fileSizeBytes" integer DEFAULT 0,
	"uploadedBy" varchar(128),
	"approvedBy" varchar(128),
	"approvedAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"workstreamId" integer NOT NULL,
	"phaseId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"milestoneType" text DEFAULT 'Deliverable',
	"status" text DEFAULT 'Not Started',
	"targetDate" varchar(32),
	"completedAt" timestamp,
	"completionEvidence" text,
	"sortOrder" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venturePermissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"userId" varchar(64) NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"grantedBy" varchar(64),
	"expiresAt" timestamp,
	"notes" text,
	"isActive" integer DEFAULT 1,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"programId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"vrlStage" integer,
	"phaseNumber" integer NOT NULL,
	"status" text DEFAULT 'Not Started',
	"startDate" varchar(32),
	"targetEndDate" varchar(32),
	"actualEndDate" varchar(32),
	"completionPercent" integer DEFAULT 0,
	"gateReviewPassed" boolean DEFAULT false,
	"gateReviewDate" varchar(32),
	"gateReviewNotes" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" text DEFAULT 'Not Started',
	"startDate" varchar(32),
	"targetEndDate" varchar(32),
	"actualEndDate" varchar(32),
	"programManager" varchar(128),
	"budget" integer DEFAULT 0,
	"budgetSpent" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"programId" integer,
	"phaseId" integer,
	"resourceType" text DEFAULT 'Person',
	"name" varchar(128) NOT NULL,
	"role" varchar(128),
	"allocationPercent" integer DEFAULT 100,
	"allocationHoursPerWeek" double precision,
	"startDate" varchar(32),
	"endDate" varchar(32),
	"dayRate" integer DEFAULT 0,
	"totalBudgeted" integer DEFAULT 0,
	"totalActual" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_risks" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"riskCategory" text NOT NULL,
	"riskTitle" varchar(255) NOT NULL,
	"riskDescription" text,
	"likelihood" integer DEFAULT 3 NOT NULL,
	"impact" integer DEFAULT 3 NOT NULL,
	"riskScore" integer DEFAULT 9 NOT NULL,
	"riskLevel" text DEFAULT 'Medium' NOT NULL,
	"vrlStageImpacted" integer,
	"mitigationPlan" text,
	"riskOwner" varchar(128),
	"status" text DEFAULT 'Open',
	"reviewDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_role_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"roleTitle" varchar(128) NOT NULL,
	"functionalArea" text NOT NULL,
	"priority" text DEFAULT 'High',
	"status" text DEFAULT 'Open',
	"minYearsExperience" integer DEFAULT 0,
	"minCapScore" integer DEFAULT 5,
	"minNetworkScore" integer DEFAULT 3,
	"minStageExperience" text DEFAULT 'Validation',
	"requiredSectors" text,
	"engagementType" text DEFAULT 'Full-Time',
	"description" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"vrl" integer NOT NULL,
	"vrlPercent" integer NOT NULL,
	"trl" integer NOT NULL,
	"trlPercent" integer NOT NULL,
	"recordedAt" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "venture_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"workstreamId" integer NOT NULL,
	"milestoneId" integer,
	"ventureId" varchar(64) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"kanbanStatus" text DEFAULT 'Backlog',
	"priority" text DEFAULT 'Medium',
	"assignee" varchar(128),
	"startDate" varchar(32),
	"dueDate" varchar(32),
	"completedAt" timestamp,
	"estimatedHours" double precision DEFAULT 0,
	"actualHours" double precision DEFAULT 0,
	"dependsOnTaskIds" text,
	"sortOrder" integer DEFAULT 0,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venture_workstreams" (
	"id" serial PRIMARY KEY NOT NULL,
	"phaseId" integer NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"functionalArea" text DEFAULT 'Other',
	"owner" varchar(128),
	"status" text DEFAULT 'Not Started',
	"completionPercent" integer DEFAULT 0,
	"startDate" varchar(32),
	"targetEndDate" varchar(32),
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ventures" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"tagline" text,
	"sector" varchar(128),
	"channel" text DEFAULT 'B2B',
	"status" text DEFAULT 'Pre-Launch',
	"vrl" integer DEFAULT 1 NOT NULL,
	"vrlPercent" integer DEFAULT 0,
	"trl" integer DEFAULT 1 NOT NULL,
	"trlPercent" integer DEFAULT 0,
	"nominatedCharity" varchar(255),
	"charityFocus" text,
	"founder" varchar(255),
	"color" varchar(32) DEFAULT '#51AF37',
	"investmentReady" boolean DEFAULT false,
	"isInternalLab" boolean DEFAULT false,
	"description" text,
	"bmc" text,
	"mmc" text,
	"lifecycleStage" text DEFAULT 'Opportunity',
	"strategicClassification" text DEFAULT 'Sustaining',
	"engineOfGrowth" text,
	"productMarketFitSignal" text DEFAULT 'Not Yet',
	"experimentPassRate" double precision,
	"learningVelocity" integer,
	"interviewInsightRate" double precision,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vrl_actions_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"action" text NOT NULL,
	"owner" varchar(100),
	"vrlActionStatus" text DEFAULT 'pending' NOT NULL,
	"linkedModule" varchar(10),
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vrl_assessments" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"trl_score" integer NOT NULL,
	"mrl_score" integer NOT NULL,
	"brl_score" integer NOT NULL,
	"eco_score" integer NOT NULL,
	"prl_score" integer NOT NULL,
	"ip_score" integer NOT NULL,
	"frl_score" integer NOT NULL,
	"reg_score" integer NOT NULL,
	"srl_score" integer NOT NULL,
	"product_score" numeric(5, 2),
	"market_score" numeric(5, 2),
	"execution_score" numeric(5, 2),
	"structural_score" numeric(5, 2),
	"sustainability_score" numeric(5, 2),
	"base_average" numeric(5, 2),
	"is_vetoed" boolean DEFAULT false NOT NULL,
	"global_vrl_score" integer,
	"band_label" varchar(64),
	"submitted_by" varchar(128)
);
--> statement-breakpoint
CREATE TABLE "vrl_dynamic_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"vrlDynH4Stage" text DEFAULT 'H4.1_ideation' NOT NULL,
	"alphaWeight" double precision DEFAULT 0.225 NOT NULL,
	"betaWeight" double precision DEFAULT 0.325 NOT NULL,
	"gammaWeight" double precision DEFAULT 0.45 NOT NULL,
	"trlNormalized" double precision,
	"brlNormalized" double precision,
	"crlNormalized" double precision,
	"riskIndex" double precision DEFAULT 0.3,
	"confidenceScore" double precision DEFAULT 0.7,
	"computedVrl" double precision,
	"trlContribution" double precision,
	"brlContribution" double precision,
	"crlContribution" double precision,
	"lastCalculatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vrl_dynamic_weights_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "vrl_scoring_params" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(64) NOT NULL,
	"alphaWeight" double precision DEFAULT 0.45 NOT NULL,
	"betaWeight" double precision DEFAULT 0.55 NOT NULL,
	"confidenceScore" double precision DEFAULT 0.5 NOT NULL,
	"confidenceRationale" text,
	"computedVrlScore" double precision,
	"computedVrlLevel" integer,
	"lastCalculatedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vrl_scoring_params_ventureId_unique" UNIQUE("ventureId")
);
--> statement-breakpoint
CREATE TABLE "vrl_spinout_checklist" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"gateKey" varchar(100) NOT NULL,
	"gateLabel" varchar(300) NOT NULL,
	"minThreshold" varchar(300),
	"evidenceRequired" varchar(500),
	"approver" varchar(100),
	"met" boolean DEFAULT false NOT NULL,
	"evidenceUrl" varchar(500),
	"metAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vrl_stage_gates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ventureId" varchar(50) NOT NULL,
	"vrlStage" text NOT NULL,
	"vrlGateStatus" text DEFAULT 'not_started' NOT NULL,
	"evidenceDocUrl" varchar(500),
	"evidenceDocName" varchar(300),
	"leadName" varchar(100),
	"score" numeric(5, 2) DEFAULT '0',
	"lastUpdated" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "widget_global_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"enableWidgetsGlobally" boolean DEFAULT true,
	"showAsSidePanel" boolean DEFAULT true,
	"showInline" boolean DEFAULT false,
	"maxRecommendedPlaybooks" integer DEFAULT 3,
	"defaultRecommendationThreshold" integer DEFAULT 40,
	"enableUsageTracking" boolean DEFAULT true,
	"enableDismissalReasons" boolean DEFAULT true,
	"enableCompletionTracking" boolean DEFAULT true,
	"enableInvestorWarningGates" boolean DEFAULT true,
	"enableStageGateWarningGates" boolean DEFAULT true,
	"updatedBy" varchar(128),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_role_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" varchar(64) NOT NULL,
	"widgetType" varchar(64) NOT NULL,
	"isVisible" boolean DEFAULT true,
	"updatedBy" varchar(128),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_threshold_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"evidenceConfidenceWarning" integer DEFAULT 50,
	"readinessScoreWarning" integer DEFAULT 40,
	"highRiskThreshold" integer DEFAULT 3,
	"investorPackWarning" integer DEFAULT 60,
	"stageGateMinEvidence" integer DEFAULT 3,
	"maxUnresolvedHighRisks" integer DEFAULT 2,
	"updatedBy" varchar(128),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflowTriggerLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"triggerType" varchar(64) NOT NULL,
	"sourceModule" varchar(64) NOT NULL,
	"sourceRecordId" integer NOT NULL,
	"targetModule" varchar(64),
	"targetRecordId" integer,
	"ventureId" varchar(64),
	"offeringId" varchar(36),
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"payload" text,
	"result" text,
	"error" text,
	"retriedFrom" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
