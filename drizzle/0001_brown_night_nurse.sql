CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`src` text NOT NULL,
	`comment` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`nickname` varchar(100) DEFAULT '名前なし',
	`period` varchar(100),
	`natsukashii` int NOT NULL DEFAULT 0,
	`isUserPost` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
