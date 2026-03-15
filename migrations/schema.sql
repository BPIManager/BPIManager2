/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `beatmaniaBpi` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `beatmaniaBpi`;

CREATE TABLE IF NOT EXISTS `apiKeys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `key` varchar(128) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `key` (`key`) USING BTREE,
  UNIQUE KEY `userId` (`userId`) USING BTREE,
  CONSTRAINT `fk_apikeys_userid` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bkScores` (
  `logId` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `title` varchar(255) NOT NULL,
  `difficulty` varchar(20) NOT NULL,
  `difficultyLevel` int(11) DEFAULT NULL,
  `exScore` int(11) NOT NULL,
  `bpi` decimal(5,2) DEFAULT NULL,
  `clearState` int(11) DEFAULT NULL,
  `missCount` int(11) DEFAULT NULL,
  `version` varchar(10) DEFAULT NULL,
  `lastPlayed` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`logId`),
  KEY `userId` (`userId`),
  KEY `version` (`version`),
  KEY `title` (`title`),
  KEY `idx_metrics` (`version`,`difficultyLevel`,`title`,`difficulty`,`userId`,`logId`,`exScore`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=13258714 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bkUsers` (
  `userId` varchar(128) NOT NULL,
  `userName` varchar(255) NOT NULL,
  `arenarank` varchar(12) DEFAULT NULL,
  `currentTotalBpi` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`userId`),
  KEY `arenarank` (`arenarank`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `followerId` varchar(128) NOT NULL,
  `followingId` varchar(128) NOT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_follower_following` (`followerId`,`followingId`),
  KEY `idx_following` (`followingId`),
  CONSTRAINT `fk_follows_follower` FOREIGN KEY (`followerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_following` FOREIGN KEY (`followingId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `logs` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `totalBpi` float NOT NULL,
  `version` varchar(50) NOT NULL,
  `batchId` varchar(100) NOT NULL COMMENT '一括更新を識別するユニークなID',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `idx_batchId_unique` (`batchId`),
  KEY `idx_user_version` (`userId`,`version`) USING BTREE,
  KEY `createdAt` (`createdAt`),
  CONSTRAINT `fk_log_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100586 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `recipientId` varchar(128) NOT NULL,
  `senderId` varchar(128) NOT NULL,
  `type` varchar(50) NOT NULL,
  `targetId` varchar(255) DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notifications_recipient` (`recipientId`,`createdAt` DESC),
  KEY `fk_notifications_sender` (`senderId`),
  CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipientId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`senderId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scores` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) DEFAULT NULL,
  `songId` int(11) DEFAULT NULL,
  `definitionId` int(11) DEFAULT NULL,
  `exScore` int(11) NOT NULL,
  `bpi` float DEFAULT NULL,
  `clearState` varchar(50) DEFAULT NULL,
  `missCount` int(11) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `lastPlayed` timestamp NOT NULL DEFAULT current_timestamp(),
  `version` varchar(50) DEFAULT NULL,
  `batchId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`logId`) USING BTREE,
  KEY `fk_score_def` (`definitionId`),
  KEY `fk_scores_batchId` (`batchId`),
  KEY `lastPlayed` (`lastPlayed`),
  KEY `idx_scores_timeline_lookup` (`version`,`userId`,`lastPlayed` DESC),
  KEY `idx_scores_song_version_user_log` (`songId`,`version`,`userId`,`logId` DESC),
  KEY `idx_scores_version_user_song_log` (`version`,`userId`,`songId`,`logId` DESC),
  KEY `idx_scores_with_winloss` (`userId`,`version`,`songId`,`logId` DESC,`exScore`),
  CONSTRAINT `fk_score_def` FOREIGN KEY (`definitionId`) REFERENCES `songDef` (`defId`),
  CONSTRAINT `fk_score_song` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE,
  CONSTRAINT `fk_score_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_batchId` FOREIGN KEY (`batchId`) REFERENCES `logs` (`batchId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1321508 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songDef` (
  `defId` int(11) NOT NULL AUTO_INCREMENT,
  `songId` int(11) DEFAULT NULL,
  `difficulty` varchar(50) NOT NULL,
  `wrScore` int(11) NOT NULL,
  `kaidenAvg` int(11) NOT NULL,
  `coef` float DEFAULT -1,
  `isCurrent` tinyint(1) DEFAULT 0,
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`defId`),
  KEY `isCurrent` (`isCurrent`),
  KEY `updatedAt` (`updatedAt`),
  KEY `songId_difficulty` (`songId`,`difficulty`),
  CONSTRAINT `fk_def_song` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1226 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songs` (
  `songId` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `notes` int(11) NOT NULL,
  `bpm` varchar(50) DEFAULT NULL,
  `difficulty` varchar(24) DEFAULT NULL,
  `difficultyLevel` int(11) DEFAULT NULL,
  `textage` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `deletedAt` varchar(50) DEFAULT NULL COMMENT '楽曲が削除されたバージョンを指定(このバージョン以降では投入しない)',
  `releasedVersion` int(11) DEFAULT NULL,
  PRIMARY KEY (`songId`),
  KEY `releasedVersion` (`releasedVersion`),
  KEY `difficulty` (`difficulty`),
  KEY `notes` (`notes`),
  KEY `bpm` (`bpm`),
  KEY `idx_lookup_notes` (`title`,`difficulty`,`notes`),
  KEY `idx_level_difficulty` (`difficultyLevel`,`difficulty`)
) ENGINE=InnoDB AUTO_INCREMENT=1209 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `userRadarCache` (
  `userId` varchar(128) NOT NULL,
  `version` varchar(20) NOT NULL,
  `notes` decimal(5,2) DEFAULT -15.00,
  `chord` decimal(5,2) DEFAULT -15.00,
  `peak` decimal(5,2) DEFAULT -15.00,
  `charge` decimal(5,2) DEFAULT -15.00,
  `scratch` decimal(5,2) DEFAULT -15.00,
  `soflan` decimal(5,2) DEFAULT -15.00,
  `totalBpi` decimal(5,2) DEFAULT -15.00,
  `updatedAt` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`userId`,`version`),
  KEY `idx_totalBpi` (`totalBpi`),
  KEY `idx_notes` (`notes`),
  KEY `idx_chord` (`chord`),
  KEY `idx_peak` (`peak`),
  KEY `idx_charge` (`charge`),
  KEY `idx_scratch` (`scratch`),
  KEY `idx_soflan` (`soflan`),
  CONSTRAINT `fk_urc_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `userId` varchar(128) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `profileText` text DEFAULT NULL,
  `profileImage` varchar(1024) DEFAULT NULL,
  `iidxId` varchar(12) DEFAULT NULL,
  `xId` varchar(12) DEFAULT NULL,
  `isPublic` int(11) NOT NULL,
  `createdAt` timestamp NULL DEFAULT NULL,
  `updatedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `userName` (`userName`),
  KEY `isPublic` (`isPublic`),
  KEY `idx_users_public_id` (`userId`,`isPublic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `userStatusLogs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `totalBpi` decimal(10,2) NOT NULL,
  `arenaRank` varchar(20) DEFAULT NULL,
  `version` varchar(10) NOT NULL,
  `batchId` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_status_logs_createdAt` (`createdAt`),
  KEY `idx_usl_user_id_desc` (`userId`,`id` DESC),
  KEY `idx_usl_user_version_id_desc` (`userId`,`version`,`id` DESC),
  CONSTRAINT `userStatusLogs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101081 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
