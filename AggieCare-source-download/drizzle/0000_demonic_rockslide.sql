CREATE TABLE `usage_daily` (
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`target` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`day`, `kind`, `target`)
);
