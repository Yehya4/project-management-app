-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : ven. 10 juil. 2026 à 17:22
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `auto_project`
--

-- --------------------------------------------------------

--
-- Structure de la table `charters`
--

CREATE TABLE `charters` (
  `id` int(11) NOT NULL,
  `demandeId` varchar(50) DEFAULT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `contexte` text DEFAULT NULL,
  `objectifs` text DEFAULT NULL,
  `perimetreInclus` text DEFAULT NULL,
  `perimetreExclu` text DEFAULT NULL,
  `sponsorIT` varchar(100) DEFAULT NULL,
  `chefProjetIT` varchar(100) DEFAULT NULL,
  `equipeIT` varchar(255) DEFAULT NULL,
  `sponsorMetier` varchar(100) DEFAULT NULL,
  `chefProjetMetier` varchar(100) DEFAULT NULL,
  `equipeMetier` varchar(255) DEFAULT NULL,
  `utilisateursFinaux` varchar(255) DEFAULT NULL,
  `planCom` text DEFAULT NULL,
  `risques` text DEFAULT NULL,
  `criteresSucces` text DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'Brouillon',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `commentaires` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `charters`
--

INSERT INTO `charters` (`id`, `demandeId`, `titre`, `contexte`, `objectifs`, `perimetreInclus`, `perimetreExclu`, `sponsorIT`, `chefProjetIT`, `equipeIT`, `sponsorMetier`, `chefProjetMetier`, `equipeMetier`, `utilisateursFinaux`, `planCom`, `risques`, `criteresSucces`, `statut`, `created_at`, `commentaires`) VALUES
(22, 'DSI-2026-001', 'Projet issu de la demande DSI-2026-001', 'test', 'test', '', '', '', 'Project Manager', '', '', '', '', '', '', '', '', 'Validé', '2026-07-09 11:32:55', '[]'),
(23, 'DSI-2026-002', 'Projet issu de la demande DSI-2026-002', 'uouo', 'jo', '', '', '', 'Project Manager', '', '', '', '', '', '', '', '', 'Validé', '2026-07-09 15:49:24', '[]');

-- --------------------------------------------------------

--
-- Structure de la table `configurations`
--

CREATE TABLE `configurations` (
  `config_key` varchar(50) NOT NULL,
  `config_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config_value`)),
  `archived_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`archived_value`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `configurations`
--

INSERT INTO `configurations` (`config_key`, `config_value`, `archived_value`) VALUES
('benefices', '[\"Diminution des Coûts\", \"Améliorations des Performances\", \"Réduction des Risques\", \"Conformité\"]', '[]'),
('categoriesProjet', '[\"Évolution majeure\", \"Maintenance corrective\", \"Nouvelle application\", \"Infra/Réseau\"]', '[]'),
('domaines', '[\"Commercial\", \"Atelier\", \"Magasin\", \"Gestion\", \"Marketing\", \"Logistique\", \"Finance\", \"Audit/Contrôle\", \"Ressources Humaines\"]', '[]'),
('natureBesoin', '[\"Réglementaire\", \"Amélioration satisfaction client\", \"Amélioration fonctionnement\"]', '[]');

-- --------------------------------------------------------

--
-- Structure de la table `demandes`
--

CREATE TABLE `demandes` (
  `id` varchar(50) NOT NULL,
  `nomDemandeur` varchar(100) DEFAULT NULL,
  `fonction` varchar(100) DEFAULT NULL,
  `domaines` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`domaines`)),
  `categoriesProjet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`categoriesProjet`)),
  `contexte` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `natureBesoin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`natureBesoin`)),
  `benefices` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`benefices`)),
  `delaiSouhaite` varchar(50) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'En attente',
  `dateCreation` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `demandes`
--

INSERT INTO `demandes` (`id`, `nomDemandeur`, `fonction`, `domaines`, `categoriesProjet`, `contexte`, `description`, `natureBesoin`, `benefices`, `delaiSouhaite`, `statut`, `dateCreation`, `created_at`) VALUES
('DSI-2026-001', 'Directeur Sponsor', 'Directeur SI', '[\"Ressources Humaines\"]', '[\"Nouveau projet\"]', 'test', 'test', '[\"Automatisation\"]', '[\"Gain de temps / Productivité\"]', '2026-07-30', 'En Développement', '09/07/2026', '2026-07-09 11:32:45'),
('DSI-2026-002', 'Directeur Sponsor', 'Directeur SI', '[\"Ressources Humaines\"]', '[\"Nouveau projet\"]', 'uouo', 'jo', '[\"Automatisation\"]', '[\"Gain de temps / Productivité\"]', '2026-07-30', 'En Développement', '09/07/2026', '2026-07-09 15:48:07');

-- --------------------------------------------------------

--
-- Structure de la table `projects`
--

CREATE TABLE `projects` (
  `id` varchar(50) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `chefProjet` varchar(100) DEFAULT NULL,
  `statut` varchar(50) DEFAULT 'Planned',
  `description` text DEFAULT NULL,
  `dateCreation` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `backlogStatus` varchar(50) DEFAULT 'Non soumis',
  `architectureStatus` varchar(50) DEFAULT 'Non soumis',
  `sponsorComment` text DEFAULT NULL,
  `backlogFile` varchar(255) DEFAULT NULL,
  `architectureFile` varchar(255) DEFAULT NULL,
  `demandeId` varchar(50) DEFAULT NULL,
  `atelierCadrage` varchar(50) DEFAULT NULL,
  `charterValidated` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `projects`
--

INSERT INTO `projects` (`id`, `nom`, `chefProjet`, `statut`, `description`, `dateCreation`, `created_at`, `backlogStatus`, `architectureStatus`, `sponsorComment`, `backlogFile`, `architectureFile`, `demandeId`, `atelierCadrage`, `charterValidated`) VALUES
('PRJ-2026-001', 'Projet Directeur Sponsor', 'Project Manager', 'Testing', 'test', '09/07/2026', '2026-07-09 11:33:07', 'Validé', 'Validé', NULL, 'Demande_SI_DSI-2026-001 (1).pdf', 'Demande_SI_DSI-2026-005.pdf', 'DSI-2026-001', 'Validé', 0),
('PRJ-2026-002', 'Projet Directeur Sponsor', 'Project Manager', 'Développement', 'jo', '09/07/2026', '2026-07-09 15:49:40', 'Validé', 'Validé', NULL, 'Demande_SI_DSI-2026-001 (2).pdf', 'Demande_SI_DSI-2026-001 (2).pdf', 'DSI-2026-002', 'Validé', 0);

-- --------------------------------------------------------

--
-- Structure de la table `project_events`
--

CREATE TABLE `project_events` (
  `id` int(11) NOT NULL,
  `projectId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `startDate` varchar(50) NOT NULL,
  `endDate` varchar(50) NOT NULL,
  `color` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `project_events`
--

INSERT INTO `project_events` (`id`, `projectId`, `title`, `description`, `startDate`, `endDate`, `color`, `createdAt`) VALUES
(6, 'PRJ-2026-001', 'test', '', '2026-07-18T09:00', '2026-07-18T18:00', '#ef4444', '2026-07-09 11:35:41'),
(7, 'PRJ-2026-001', 'Réunion', '', '2026-07-30T09:00', '2026-07-30T18:00', '#10b981', '2026-07-09 11:35:55'),
(8, 'PRJ-2026-002', 'vghdgcb', '', '2026-07-24T09:00', '2026-07-24T18:00', '#f59e0b', '2026-07-09 15:53:06');

-- --------------------------------------------------------

--
-- Structure de la table `project_members`
--

CREATE TABLE `project_members` (
  `id` int(11) NOT NULL,
  `projectId` varchar(50) NOT NULL,
  `userId` varchar(50) NOT NULL,
  `role` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `project_members`
--

INSERT INTO `project_members` (`id`, `projectId`, `userId`, `role`, `created_at`) VALUES
(47, 'PRJ-2026-001', 'u2', 'Chef de Projet', '2026-07-09 11:33:08'),
(48, 'PRJ-2026-001', 'u4', 'Admin', '2026-07-09 11:33:08'),
(50, 'PRJ-2026-001', 'u3', 'Sponsor', '2026-07-09 11:33:08'),
(55, 'PRJ-2026-002', 'u2', 'Chef de Projet', '2026-07-09 15:49:41'),
(56, 'PRJ-2026-002', 'u4', 'Admin', '2026-07-09 15:49:41'),
(58, 'PRJ-2026-002', 'u3', 'Sponsor', '2026-07-09 15:49:41'),
(63, 'PRJ-2026-002', 'u1783437439512', 'Développeur', '2026-07-09 16:04:51');

-- --------------------------------------------------------

--
-- Structure de la table `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(50) NOT NULL,
  `projectId` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(50) NOT NULL,
  `assigneeId` varchar(50) DEFAULT NULL,
  `status` varchar(100) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `tasks`
--

INSERT INTO `tasks` (`id`, `projectId`, `title`, `description`, `priority`, `assigneeId`, `status`, `createdAt`) VALUES
('TASK-1783596830325', 'PRJ-2026-001', 'test', 't', 'Haute', 'u2', 'Fait', '2026-07-09 11:33:50'),
('TASK-1783612295014', 'PRJ-2026-002', ',n', 'j', 'Moyenne', NULL, 'En cours', '2026-07-09 15:51:35');

-- --------------------------------------------------------

--
-- Structure de la table `test_cases`
--

CREATE TABLE `test_cases` (
  `id` int(11) NOT NULL,
  `projectId` varchar(50) NOT NULL,
  `testCaseId` varchar(50) NOT NULL,
  `testName` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `expectedResult` text NOT NULL,
  `status` varchar(20) DEFAULT 'En attente',
  `comment` text DEFAULT NULL,
  `testerId` varchar(50) DEFAULT NULL,
  `testerName` varchar(100) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `test_cases`
--

INSERT INTO `test_cases` (`id`, `projectId`, `testCaseId`, `testName`, `description`, `expectedResult`, `status`, `comment`, `testerId`, `testerName`, `createdAt`, `updatedAt`) VALUES
(16, 'PRJ-2026-001', 'TC-001', 'connexion', 'test', 'test', 'Réussite', 'h', 'u3', 'Directeur Sponsor', '2026-07-09 11:34:13', '2026-07-09 11:34:52');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `matricule` varchar(50) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `fonction` varchar(100) DEFAULT NULL,
  `telephone` varchar(50) DEFAULT NULL,
  `emailPersonnelle` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'User',
  `archived` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `matricule`, `nom`, `prenom`, `fonction`, `telephone`, `emailPersonnelle`, `email`, `password`, `role`, `archived`, `created_at`) VALUES
('u1', 'M001', 'Yahya', 'N1', 'RH', '0600000001', 'yahya@mail.com', 'yahya@mail.com', '$2b$10$.X18dpzn8LykHBgYTFezwOP7e0OCZ0M4ms7/vh4OEgkbOb4Va29cS', 'User', 0, '2026-07-06 08:01:09'),
('u1783437439512', 'M005', 'developer', 'fullstack', 'Developer', '', '', 'developer@mail.com', '$2b$10$.X18dpzn8LykHBgYTFezwOP7e0OCZ0M4ms7/vh4OEgkbOb4Va29cS', 'Developer', 0, '2026-07-07 15:17:19'),
('u1783439827852', 'M006', 'developer', 'UI/UX', 'developer', 'admin@mail.com', '', 'developer2@mail.com', '$2b$10$V7MoTqsT.gqy2JJMr3JGnOXoT9LH.rC9qM8afQUEr8HwDjHaZLk26', 'Developer', 0, '2026-07-07 15:57:07'),
('u1783440604368', 'M007', 'testeur', 'fonction', 'testeur', '0658741256', '', 'testeur@mail.com', '$2b$10$UwaxqLmAbLUeN6TGMHI5x.STmohKdAA5cR1X/nEtYMpjXbbtVxUB6', 'Tester', 0, '2026-07-07 16:10:03'),
('u1783524386566', 'M008', 'user', 'N2', 'utilisateur', '0614587458', 'user1@mail.com', 'user@mail.com', '$2b$10$Zdz0Rsm1TUAC4sgkJVisuOK9mCA8AMeYFdVRRQ0g.uzB6hwwnbfN2', 'User', 0, '2026-07-08 15:26:26'),
('u2', 'M002', 'Manager', 'Project', 'Chef de Projet', '0600000002', 'perso2@mail.com', 'manager@mail.com', '$2b$10$.X18dpzn8LykHBgYTFezwOP7e0OCZ0M4ms7/vh4OEgkbOb4Va29cS', 'Project Manager', 0, '2026-07-06 08:01:09'),
('u3', 'M003', 'Sponsor', 'Directeur', 'Directeur SI', '0600000003', 'perso3@mail.com', 'sponsor@mail.com', '$2b$10$.X18dpzn8LykHBgYTFezwOP7e0OCZ0M4ms7/vh4OEgkbOb4Va29cS', 'Sponsor', 0, '2026-07-06 08:01:09'),
('u4', 'M004', 'Admin', 'Système', 'Administrateur', '0600000004', 'perso4@mail.com', 'admin@mail.com', '$2b$10$.X18dpzn8LykHBgYTFezwOP7e0OCZ0M4ms7/vh4OEgkbOb4Va29cS', 'Admin', 0, '2026-07-06 08:01:09');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `charters`
--
ALTER TABLE `charters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `demandeId` (`demandeId`);

--
-- Index pour la table `configurations`
--
ALTER TABLE `configurations`
  ADD PRIMARY KEY (`config_key`);

--
-- Index pour la table `demandes`
--
ALTER TABLE `demandes`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `project_events`
--
ALTER TABLE `project_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projectId` (`projectId`);

--
-- Index pour la table `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_user` (`projectId`,`userId`),
  ADD KEY `userId` (`userId`);

--
-- Index pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projectId` (`projectId`),
  ADD KEY `assigneeId` (`assigneeId`);

--
-- Index pour la table `test_cases`
--
ALTER TABLE `test_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projectId` (`projectId`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `charters`
--
ALTER TABLE `charters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT pour la table `project_events`
--
ALTER TABLE `project_events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `project_members`
--
ALTER TABLE `project_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT pour la table `test_cases`
--
ALTER TABLE `test_cases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `charters`
--
ALTER TABLE `charters`
  ADD CONSTRAINT `charters_ibfk_1` FOREIGN KEY (`demandeId`) REFERENCES `demandes` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `project_events`
--
ALTER TABLE `project_events`
  ADD CONSTRAINT `project_events_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `project_members_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `project_members_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`assigneeId`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `test_cases`
--
ALTER TABLE `test_cases`
  ADD CONSTRAINT `test_cases_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
