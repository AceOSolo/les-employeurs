-- ==========================================================================
-- Les Employeurs · base MySQL des comptes et diagnostics
-- À importer une fois dans la base MySQL de l'hébergement OVH
-- (espace client OVH › Hébergement › Bases de données › phpMyAdmin › Importer).
-- Compatible MySQL 8 et MariaDB 10.5+.
-- ==========================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS le_users (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  consent_at     DATETIME     NOT NULL,  -- date du consentement (case cochée à la création)
  created_at     DATETIME     NOT NULL,
  last_login_at  DATETIME     NOT NULL,  -- sert à la purge des comptes inactifs (3 ans)
  PRIMARY KEY (id),
  UNIQUE KEY le_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS le_sessions (
  token_hash  CHAR(64)     NOT NULL,     -- empreinte SHA-256 du jeton (le jeton n'est jamais stocké)
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (token_hash),
  KEY le_sessions_user (user_id),
  CONSTRAINT le_sessions_user_fk FOREIGN KEY (user_id) REFERENCES le_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS le_password_resets (
  token_hash  CHAR(64)     NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (token_hash),
  KEY le_password_resets_user (user_id),
  CONSTRAINT le_password_resets_user_fk FOREIGN KEY (user_id) REFERENCES le_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS le_diagnostics (
  seq           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id            CHAR(36)     NOT NULL,   -- identifiant public (UUID)
  user_id       INT UNSIGNED NOT NULL,
  piece         VARCHAR(20)  NOT NULL,
  version       SMALLINT     NOT NULL DEFAULT 1,
  answers       MEDIUMTEXT   NOT NULL,   -- JSON : { "1.2": 0..3 | "nc" }
  scores        TEXT         NOT NULL,   -- JSON : { global, families: { "1": 0..100 | null } }
  score_global  TINYINT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL,
  PRIMARY KEY (seq),
  UNIQUE KEY le_diagnostics_id (id),
  KEY le_diagnostics_user (user_id, created_at),
  CONSTRAINT le_diagnostics_user_fk FOREIGN KEY (user_id) REFERENCES le_users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS le_attempts (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  key_hash    CHAR(64)     NOT NULL,     -- empreinte de (action, IP ou compte) : aucune IP en clair
  created_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY le_attempts_key (key_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
