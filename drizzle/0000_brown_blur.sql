CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`providerAccountId` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Account_provider_providerAccountId_key` ON `account` (`provider`,`providerAccountId`);--> statement-breakpoint
CREATE INDEX `Account_userId_fkey` ON `account` (`userId`);--> statement-breakpoint
CREATE TABLE `resumesettings` (
	`id` text PRIMARY KEY NOT NULL,
	`resumeId` text NOT NULL,
	`fontname` text DEFAULT 'default' NOT NULL,
	`pagePadding` integer DEFAULT 36 NOT NULL,
	`pageLineHeight` real DEFAULT 1.9 NOT NULL,
	`pageBackground` text DEFAULT 'default' NOT NULL,
	`pageThemeColor` text DEFAULT '0,0,0' NOT NULL,
	`imagePosition` text NOT NULL,
	`isScrollable` integer DEFAULT 0 NOT NULL,
	`editorMode` text DEFAULT 'source' NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ResumeSettings_resumeId_key` ON `resumesettings` (`resumeId`);--> statement-breakpoint
CREATE TABLE `resume` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`content` text NOT NULL,
	`theme` text DEFAULT 'default' NOT NULL,
	`plugins` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer NOT NULL,
	`isDefault` integer DEFAULT 0 NOT NULL,
	`userId` text
);
--> statement-breakpoint
CREATE INDEX `Resume_userId_fkey` ON `resume` (`userId`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionToken` text NOT NULL,
	`userId` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Session_sessionToken_key` ON `session` (`sessionToken`);--> statement-breakpoint
CREATE INDEX `Session_userId_fkey` ON `session` (`userId`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`emailVerified` integer,
	`image` text,
	`passwordHash` text,
	`emailVerificationCode` text,
	`emailVerificationExpires` integer,
	`emailVerificationAttempts` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_key` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verificationtoken` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `VerificationToken_token_key` ON `verificationtoken` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `VerificationToken_identifier_token_key` ON `verificationtoken` (`identifier`,`token`);