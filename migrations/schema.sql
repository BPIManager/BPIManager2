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

CREATE TABLE IF NOT EXISTS `allScores` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `songId` int(11) NOT NULL,
  `definitionId` int(11) DEFAULT NULL,
  `exScore` int(11) NOT NULL,
  `bpi` float DEFAULT NULL,
  `clearState` varchar(50) DEFAULT NULL,
  `missCount` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastPlayed` timestamp NOT NULL DEFAULT current_timestamp(),
  `version` varchar(50) NOT NULL,
  `batchId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`logId`) USING BTREE,
  KEY `idx_fk_score_def` (`definitionId`) USING BTREE,
  KEY `idx_fk_scores_batchId` (`batchId`) USING BTREE,
  KEY `lastPlayed` (`lastPlayed`) USING BTREE,
  KEY `idx_scores_timeline_lookup` (`version`,`userId`,`lastPlayed` DESC) USING BTREE,
  KEY `idx_scores_song_version_user_log` (`songId`,`version`,`userId`,`logId` DESC) USING BTREE,
  KEY `idx_scores_version_user_song_log` (`version`,`userId`,`songId`,`logId` DESC) USING BTREE,
  KEY `idx_scores_with_winloss` (`userId`,`version`,`songId`,`logId` DESC,`exScore`) USING BTREE,
  KEY `idx_scores_lastPlayed_version` (`lastPlayed` DESC,`version`) USING BTREE,
  KEY `idx_scores_lookup_v2` (`userId`,`songId`,`version`,`exScore`,`logId`) USING BTREE,
  CONSTRAINT `fk_allScores_allSongs` FOREIGN KEY (`songId`) REFERENCES `allSongs` (`songId`) ON DELETE CASCADE,
  CONSTRAINT `fk_allScores_songDef` FOREIGN KEY (`definitionId`) REFERENCES `songDef` (`defId`),
  CONSTRAINT `fk_allScores_users` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=594494 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `allSongs` (
  `songId` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `notes` int(11) NOT NULL,
  `bpm` varchar(50) NOT NULL,
  `difficulty` varchar(24) NOT NULL,
  `difficultyLevel` int(11) NOT NULL,
  `textage` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `deletedAt` varchar(50) DEFAULT NULL COMMENT '楽曲が削除されたバージョンを指定(このバージョン以降では投入しない)',
  `releasedVersion` varchar(3) DEFAULT NULL,
  PRIMARY KEY (`songId`) USING BTREE,
  KEY `releasedVersion` (`releasedVersion`) USING BTREE,
  KEY `difficulty` (`difficulty`) USING BTREE,
  KEY `notes` (`notes`) USING BTREE,
  KEY `bpm` (`bpm`) USING BTREE,
  KEY `idx_lookup_notes` (`title`,`difficulty`,`notes`) USING BTREE,
  KEY `idx_level_difficulty` (`difficultyLevel`,`difficulty`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5843 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `apiKeys` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `key` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `key` (`key`) USING BTREE,
  UNIQUE KEY `userId` (`userId`) USING BTREE,
  CONSTRAINT `fk_apikeys_userid` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS `discordLinks` (
  `discordUserId` varchar(64) NOT NULL,
  `userId` varchar(128) NOT NULL,
  `linkedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`discordUserId`),
  UNIQUE KEY `userId` (`userId`),
  CONSTRAINT `fk_discordlinks_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `follows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `followerId` varchar(128) NOT NULL,
  `followingId` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_follower_following` (`followerId`,`followingId`),
  KEY `idx_following` (`followingId`),
  KEY `idx_following_follower` (`followingId`,`followerId`),
  CONSTRAINT `fk_follows_follower` FOREIGN KEY (`followerId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_following` FOREIGN KEY (`followingId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=580 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB AUTO_INCREMENT=227985 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `userId` varchar(128) NOT NULL,
  `lastReadAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userId`),
  CONSTRAINT `fk_notifications_user_id` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `optimizeMemo` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `reportId` varchar(36) NOT NULL COMMENT '一意のUUID',
  `userId` varchar(128) NOT NULL,
  `reportData` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '計算結果のJSON' CHECK (json_valid(`reportData`)),
  `targetBpi` float DEFAULT NULL COMMENT '検索性のための目標BPI（任意）',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_reportId_unique` (`reportId`),
  KEY `idx_report_userId_createdAt` (`userId`,`createdAt` DESC),
  CONSTRAINT `fk_reports_users` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `scores` (
  `logId` bigint(20) NOT NULL AUTO_INCREMENT,
  `userId` varchar(128) NOT NULL,
  `songId` int(11) NOT NULL,
  `definitionId` int(11) NOT NULL,
  `exScore` int(11) NOT NULL,
  `bpi` float DEFAULT NULL,
  `clearState` varchar(50) DEFAULT NULL,
  `missCount` int(11) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastPlayed` timestamp NOT NULL DEFAULT current_timestamp(),
  `version` varchar(50) NOT NULL,
  `batchId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`logId`) USING BTREE,
  KEY `fk_score_def` (`definitionId`),
  KEY `fk_scores_batchId` (`batchId`),
  KEY `lastPlayed` (`lastPlayed`),
  KEY `idx_scores_timeline_lookup` (`version`,`userId`,`lastPlayed` DESC),
  KEY `idx_scores_song_version_user_log` (`songId`,`version`,`userId`,`logId` DESC),
  KEY `idx_scores_version_user_song_log` (`version`,`userId`,`songId`,`logId` DESC),
  KEY `idx_scores_with_winloss` (`userId`,`version`,`songId`,`logId` DESC,`exScore`),
  KEY `idx_scores_lastPlayed_version` (`lastPlayed` DESC,`version`),
  KEY `idx_scores_lookup_v2` (`userId`,`songId`,`version`,`exScore`,`logId`),
  KEY `idx_scores_bpm_dist` (`userId`,`version`,`songId`,`logId`,`bpi`),
  KEY `idx_scores_user_song_logid` (`userId`,`songId`,`logId` DESC),
  CONSTRAINT `fk_score_def` FOREIGN KEY (`definitionId`) REFERENCES `songDef` (`defId`),
  CONSTRAINT `fk_score_song` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE,
  CONSTRAINT `fk_score_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_batchId` FOREIGN KEY (`batchId`) REFERENCES `logs` (`batchId`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3092606 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songAttributes` (
  `songId` int(11) NOT NULL,
  `p_intensity` float DEFAULT 0,
  `p_scratch` float DEFAULT 0,
  `p_soflan` float DEFAULT 0,
  `p_cn` float DEFAULT 0,
  `p_udeoshi` float DEFAULT 0 COMMENT '腕押し',
  `p_chord` float DEFAULT 0,
  `p_delay` float DEFAULT 0,
  `p_scratch_complex` float DEFAULT 0,
  `p_tateren` float DEFAULT 0 COMMENT '縦連打',
  `p_trill_denim` float DEFAULT 0,
  `g_intensity` float DEFAULT 0,
  `g_scratch` float DEFAULT 0,
  `g_soflan` float DEFAULT 0,
  `g_cn` float DEFAULT 0,
  `g_udeoshi` float DEFAULT 0,
  `g_chord` float DEFAULT 0,
  `g_delay` float DEFAULT 0,
  `g_scratch_complex` float DEFAULT 0,
  `g_tateren` float DEFAULT 0,
  `g_trill_denim` float DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`songId`),
  CONSTRAINT `fk_attr_songId` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songDef` (
  `defId` int(11) NOT NULL AUTO_INCREMENT,
  `songId` int(11) NOT NULL,
  `wrScore` int(11) NOT NULL,
  `kaidenAvg` int(11) NOT NULL,
  `coef` float DEFAULT -1,
  `isCurrent` tinyint(1) DEFAULT 0,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`defId`),
  KEY `isCurrent` (`isCurrent`),
  KEY `updatedAt` (`updatedAt`),
  KEY `songId_difficulty` (`songId`),
  CONSTRAINT `fk_def_song` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3748 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songs` (
  `songId` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `notes` int(11) NOT NULL,
  `bpm` varchar(50) NOT NULL,
  `difficulty` varchar(24) NOT NULL,
  `difficultyLevel` int(11) NOT NULL,
  `textage` varchar(255) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `deletedAt` varchar(50) DEFAULT NULL COMMENT '楽曲が削除されたバージョンを指定(このバージョン以降では投入しない)',
  `releasedVersion` int(11) DEFAULT NULL,
  PRIMARY KEY (`songId`),
  KEY `releasedVersion` (`releasedVersion`),
  KEY `difficulty` (`difficulty`),
  KEY `notes` (`notes`),
  KEY `bpm` (`bpm`),
  KEY `idx_lookup_notes` (`title`,`difficulty`,`notes`),
  KEY `idx_level_difficulty` (`difficultyLevel`,`difficulty`)
) ENGINE=InnoDB AUTO_INCREMENT=1301 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS `userRoles` (
  `userId` varchar(128) NOT NULL,
  `role` enum('coffee','saba','iidx','developer','pro') NOT NULL,
  `description` varchar(255) DEFAULT '',
  `grantedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`userId`),
  UNIQUE KEY `idx_user_role` (`userId`,`role`),
  CONSTRAINT `fk_userroles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `userId` varchar(128) NOT NULL,
  `userName` varchar(50) NOT NULL,
  `profileText` text DEFAULT NULL,
  `profileImage` varchar(1024) DEFAULT NULL,
  `iidxId` varchar(12) DEFAULT NULL,
  `xId` varchar(20) DEFAULT NULL,
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
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_status_logs_createdAt` (`createdAt`),
  KEY `idx_usl_user_id_desc` (`userId`,`id` DESC),
  KEY `idx_usl_user_version_id_desc` (`userId`,`version`,`id` DESC),
  CONSTRAINT `userStatusLogs_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=229649 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songNotes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `songId` int(11) NOT NULL,
  `userId` varchar(128) NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_song_notes_songId_createdAt` (`songId`,`createdAt` DESC),
  KEY `idx_song_notes_userId` (`userId`),
  CONSTRAINT `fk_song_notes_songId` FOREIGN KEY (`songId`) REFERENCES `songs` (`songId`) ON DELETE CASCADE,
  CONSTRAINT `fk_song_notes_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `songNoteUpvotes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `noteId` bigint(20) unsigned NOT NULL,
  `userId` varchar(128) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_note_upvote_unique` (`noteId`,`userId`),
  KEY `idx_upvote_userId` (`userId`),
  CONSTRAINT `fk_upvote_noteId` FOREIGN KEY (`noteId`) REFERENCES `songNotes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_upvote_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
