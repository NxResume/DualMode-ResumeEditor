CREATE TABLE `photoupload` (
	`id` text PRIMARY KEY NOT NULL,
	`objectKey` text NOT NULL,
	`actor` text NOT NULL,
	`bytes` integer NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `PhotoUpload_actor_createdAt_idx` ON `photoupload` (`actor`,`createdAt`);