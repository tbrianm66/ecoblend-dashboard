ALTER TABLE `crmPipelines` ADD `offeringId` varchar(36);--> statement-breakpoint
ALTER TABLE `experiments` ADD `offeringId` varchar(36);--> statement-breakpoint
ALTER TABLE `milestones` ADD `offeringId` varchar(36);--> statement-breakpoint
ALTER TABLE `risks` ADD `offeringId` varchar(36);--> statement-breakpoint
ALTER TABLE `workflowTriggerLog` ADD `offeringId` varchar(36);