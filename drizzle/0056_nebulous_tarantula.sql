CREATE TABLE `coaching_onboarding_state` (
	`id` int AUTO_INCREMENT NOT NULL,
	`founder_id` varchar(255) NOT NULL,
	`current_vrl_stage` int NOT NULL DEFAULT 1,
	`onboarding_completed` boolean NOT NULL DEFAULT false,
	`template_applied` boolean NOT NULL DEFAULT false,
	`completed_at` bigint,
	`created_at` bigint NOT NULL,
	`updated_at` bigint NOT NULL,
	CONSTRAINT `coaching_onboarding_state_id` PRIMARY KEY(`id`),
	CONSTRAINT `coaching_onboarding_state_founder_id_unique` UNIQUE(`founder_id`)
);
