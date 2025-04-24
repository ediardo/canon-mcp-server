CREATE TABLE `camera` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manufacturer` text NOT NULL,
	`modelName` text NOT NULL,
	`serialNumber` text NOT NULL,
	`firmwareVersion` text NOT NULL,
	`macAddress` text NOT NULL,
	`ipAddress` text NOT NULL,
	`port` integer NOT NULL,
	`https` integer NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL
);
