# 🚀 Auto Project — Plateforme Fullstack de Gestion de Projets & Demandes SI

[![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/API-Express_5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/Database-MySQL_8.4-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Nginx](https://img.shields.io/badge/Reverse_Proxy-Nginx-009639?logo=nginx&logoColor=white)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/DevOps-Docker_%26_Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 📌 Sommaire

1. [Aperçu du Projet](#-aperçu-du-projet)
2. [Fonctionnalités Principales](#-fonctionnalités-principales)
3. [Architecture Applicative](#-architecture-applicative)
4. [DevOps : Conteneurisation avec Docker](#-devops--conteneurisation-avec-docker)
5. [DevOps : Orchestration avec Kubernetes (K8s)](#-devops--orchestration-avec-kubernetes-k8s)
6. [Structure du Projet](#-structure-du-projet)
7. [Installation et Lancement](#-installation-et-lancement)
   - [Option 1 : Démarrage avec Docker Compose (Recommandé)](#option-1--démarrage-avec-docker-compose-recommandé)
   - [Option 2 : Démarrage en Environnement Local](#option-2--démarrage-en-environnement-local)
8. [Variables d'Environnement](#-variables-denvironnement)
9. [Sécurité et Bonnes Pratiques](#-sécurité-et-bonnes-pratiques)
10. [Licence](#-licence)

---

## 🌟 Aperçu du Projet

**Auto Project** est une solution d'entreprise fullstack conçue pour centraliser et digitaliser la gouvernance des projets informatiques et des demandes SI (Systèmes d'Information).

Elle offre une interface moderne, intuitive et réactive pour piloter le cycle de vie complet des projets : de l'expression du besoin initiale à la livraison finale, en passant par la constitution de la charte projet, la planification des sprints, le suivi budgétaire et la gestion de la recette fonctionnelle.

---

## ✨ Fonctionnalités Principales

- 📋 **Gestion des Demandes SI :** Soumission, qualification, workflow de validation hiérarchique et suivi en temps réel.
- 📑 **Charte Projet (Project Charter) :** Cadrage stratégique, définition des objectifs, périmètre, parties prenantes et jalons clés.
- 📊 **Tableau de Bord & Vue d'Ensemble :** Indicateurs d'avancement, KPIs de performance et synthèse globale.
- 📝 **Backlog & Gestion des Tâches :** Suivi Kanban/listes des tâches, assignation par collaborateur, statuts et priorités.
- 📅 **Calendrier & Jalons :** Visualisation des échéances, réunions et livrables critiques.
- 🧪 **Cahier de Recette & Tests :** Suivi des cas de tests, anomalies relevées et validation QA.
- 👥 **Gestion des Équipes & Rôles (RBAC) :** Matrice de responsabilités (RACI), gestion fine des accès et des permissions utilisateurs.
- 💰 **Suivi Budgétaire & Utilisation :** Gestion des allocations budgétaires et suivi des dépenses.
- 📂 **Gestion Documentaire & Exports :** Génération et export automatisé de rapports aux formats **PDF**, **Word (.docx)** et **Excel (.xlsx)**.
- 💬 **Messagerie & Notifications en Temps Réel :** Chat interne collaboratif et alertes instantanées propulsées par **Socket.io**.

---

## 🏗 Architecture Applicative

L'application repose sur une architecture moderne à 4 niveaux, entièrement découplée et conteneurisée :

```
                        ┌───────────────────────────────┐
                        │      Utilisateurs (Web)       │
                        └───────────────┬───────────────┘
                                        │ HTTP:80 / HTTPS:443
                                        ▼
                        ┌───────────────────────────────┐
                        │    Nginx (Reverse Proxy)      │
                        │ - Compression Gzip            │
                        │ - Headers Sécurité (CSP, XSS) │
                        │ - Proxification WebSockets    │
                        └───────┬───────────────┬───────┘
                                │               │
          Routage /*            │               │ Routage /api/* et /socket.io/*
                                ▼               ▼
            ┌───────────────────────┐       ┌───────────────────────┐
            │   Frontend (React)    │       │  Backend (Node/Exp.)  │
            │  Port interne: 3000   │       │  Port interne: 5000   │
            │  - React 19           │       │  - Express 5 REST     │
            │  - Tailwind CSS       │       │  - Socket.io Server   │
            │  - Lucide Icons       │       │  - Winston Logger     │
            └───────────────────────┘       └───────────┬───────────┘
                                                        │ Connexion TCP:3306
                                                        ▼
                                            ┌───────────────────────┐
                                            │      MySQL 8.4        │
                                            │  - Base auto_project  │
                                            │  - Volume persistant  │
                                            └───────────────────────┘
```

---

## 🐳 DevOps : Conteneurisation avec Docker

Le projet intègre une démarche DevOps rigoureuse dès sa conception, permettant de garantir des environnements de développement, test et production strictement identiques.

### 1. Caractéristiques des Conteneurs

- **Backend (`backend/Dockerfile`) :**
  - Image de base allégée : `node:22-alpine` pour une surface d'attaque et un poids d'image minimaux.
  - Sécurité renforcée : Exécution sous utilisateur non-root (`USER 1001`).
  - Dépendances de production isolées via `npm ci --omit=dev`.
  - Healthcheck natif intégré vérifiant le endpoint `/health`.
  
- **Frontend (`frontend/Dockerfile`) :**
  - Image de base : `node:22-alpine`.
  - Build de production optimisé et servi via un serveur léger (`serve`).
  - Cache Docker optimisé par copie séquentielle des fichiers `package*.json`.

- **Reverse Proxy Nginx (`nginx/Dockerfile` & `nginx/nginx.conf`) :**
  - Centralisation des flux entrants sur les ports `80` et `443`.
  - Routage transparent vers l'API (`/api/`) et le frontend (`/`).
  - Prise en charge native des WebSockets (`/socket.io/`) avec gestion du header `Upgrade`.
  - Headers de sécurité HTTP stricts (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`).
  - Endpoint de santé `/nginx-health`.

- **Base de données MySQL :**
  - Version officielle `mysql:8.4`.
  - Initialisation automatique des tables et données via `auto_project.sql` monté dans `/docker-entrypoint-initdb.d/`.
  - Persistance des données assurée par un volume Docker dédié (`db_data`).

### 2. Orchestration locale avec Docker Compose

Le fichier `docker-compose.yml` orchestre les 4 conteneurs avec gestion des dépendances (`depends_on`), conditions de santé (`service_healthy`) et réseau interne unifié.

```bash
# Démarrer l'ensemble de la pile applicative en arrière-plan
docker compose up -d --build

# Suivre les journaux d'exécution
docker compose logs -f

# Vérifier l'état de santé des services
docker compose ps

# Arrêter les conteneurs tout en conservant les données
docker compose down
```

---

## ☸️ DevOps : Orchestration avec Kubernetes (K8s)

L'architecture est entièrement préparée pour un déploiement cloud-native à grande échelle sur un cluster Kubernetes (**Minikube**, **Kind**, **EKS**, **GKE**, ou **AKS**).

### 1. Architecture Cible sur Kubernetes

```
                                [ Ingress Controller ]
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    │                                           │
             Host: /api/*, /socket.io/*                      Host: /*
                    │                                           │
                    ▼                                           ▼
          [ Service: backend ]                        [ Service: frontend ]
             (ClusterIP: 5000)                           (ClusterIP: 3000)
                    │                                           │
          [ Pods: Backend x2 ]                        [ Pods: Frontend x2 ]
                    │
                    ▼
          [ Service: mysql-db ]
             (ClusterIP: 3306)
                    │
          [ Pod: MySQL (Stateful) ]
                    │
          [ PersistentVolumeClaim ]
                    │
          [ PersistentVolume (SSD) ]
```

### 2. Objets Kubernetes et Rôles

| Objet Kubernetes | Composant | Rôle & Spécificités |
| :--- | :--- | :--- |
| **Namespace** | `autoproject` | Isole l'ensemble des ressources applicatives du cluster. |
| **Secret** | `mysql-secret`, `backend-secret` | Stocke de manière chiffrée les mots de passe DB, `JWT_SECRET` et clés `ENCRYPTION_KEY`. |
| **ConfigMap** | `backend-config`, `mysql-config` | Centralise les variables non sensibles (ports, hôtes, niveaux de log, CORS). |
| **PVC** (PersistentVolumeClaim) | `mysql-pvc` | Réserve le stockage persistant sur disque pour garantir la durabilité des données MySQL. |
| **Deployment / StatefulSet** | `mysql-db` | Gère le cycle de vie du conteneur de base de données MySQL 8.4 avec liveness/readiness probes. |
| **Deployment** | `backend` | Assure la haute disponibilité (2 répliques ou plus) avec sondes de santé HTTP `/health`. |
| **Deployment** | `frontend` | Assure le service de l'application cliente React compilée avec équilibrage de charge. |
| **Service (ClusterIP)** | `backend`, `frontend`, `mysql-db` | Expose les pods à l'intérieur du réseau virtuel sécurisé du cluster. |
| **Ingress** | `autoproject-ingress` | Gère le point d'entrée unique HTTP/HTTPS, la terminaison SSL/TLS et le routage des requêtes. |
| **HPA** (Horizontal Pod Autoscaler) | `backend-hpa` | Ajuste dynamiquement le nombre de pods backend en fonction de la charge CPU/RAM. |

### 3. Exemple de Déploiement Typique sur Kubernetes

```bash
# 1. Créer le namespace dédié
kubectl create namespace autoproject

# 2. Créer les secrets applicatifs
kubectl create secret generic backend-secret \
  --from-literal=DB_PASSWORD="VOTRE_MOT_DE_PASSE" \
  --from-literal=JWT_SECRET="VOTRE_CLE_SECRETE_JWT" \
  --from-literal=ENCRYPTION_KEY="VOTRE_CLE_CHIFFREMENT_32_CHARS" \
  -n autoproject

# 3. Appliquer les manifestes (Configuration, Base de données, Backend, Frontend, Ingress)
kubectl apply -f k8s/ -n autoproject

# 4. Surveiller le statut des Pods et Services
kubectl get pods,svc,pvc,ingress -n autoproject -o wide
```

---

## 📁 Structure du Projet

```text
Auto Project/
│
├── .gitignore                   # Fichiers et dossiers exclus du suivi Git
├── auto_project.sql             # Script d'initialisation et schéma de la BDD MySQL
├── docker-compose.yml           # Orchestration Docker multi-services
├── migrate.js                   # Script d'assistance aux migrations
├── README.md                    # Documentation complète du projet
│
├── backend/                     # API REST & Serveur WebSocket (Node.js/Express)
│   ├── .dockerignore
│   ├── .env.example             # Modèle des variables d'environnement
│   ├── Dockerfile               # Image Docker du backend (Alpine, non-root)
│   ├── package.json
│   └── src/
│       ├── config/              # Configuration de la base de données (Pool MySQL)
│       ├── controllers/         # Contrôleurs métier (Auth, Projet, Tâches, etc.)
│       ├── middleware/          # JWT, contrôle des rôles (RBAC), sécurité
│       ├── migrations/          # Scripts de migration
│       ├── routes/              # Définition des routes API
│       ├── services/            # Couche de services et logique applicative
│       ├── utils/               # Logger Winston, chiffrement AES
│       └── index.js             # Point d'entrée de l'application Node.js
│
├── frontend/                    # Application cliente (React 19, Tailwind CSS)
│   ├── .dockerignore
│   ├── Dockerfile               # Image Docker frontend de production
│   ├── package.json
│   ├── tailwind.config.js       # Configuration des thèmes et styles
│   ├── public/                  # Fichiers statiques et index HTML
│   └── src/
│       ├── components/          # Composants UI réutilisables (Sidebar, Modales...)
│       ├── context/             # Contexte React global (AuthContext, etc.)
│       ├── pages/               # Vues principales et sous-pages projets
│       ├── utils/               # Helpers, formatage, clients API
│       ├── App.js               # Routeur et structure principale
│       └── index.js             # Point de montage React
│
└── nginx/                       # Reverse Proxy et passerelle d'accès
    ├── Dockerfile               # Image Docker Nginx
    └── nginx.conf               # Configuration avancée (SSL, Gzip, Headers, Proxies)
```

---

## 🚀 Installation et Lancement

### Option 1 : Démarrage avec Docker Compose (Recommandé)

C'est la méthode la plus rapide et la plus fiable pour lancer l'ensemble des composants sans avoir à installer Node.js ou MySQL sur votre machine hôte.

#### 1. Cloner le dépôt

```bash
git clone https://github.com/Yehya4/project-management-app.git
cd project-management-app
```

#### 2. Configurer les variables d'environnement

Copiez le modèle de variables pour le backend :

```bash
cp backend/.env.example backend/.env
```

*Adaptez les valeurs au besoin (mots de passe, secrets JWT).*

#### 3. Démarrer les services

```bash
docker compose up -d --build
```

#### 4. Accéder à l'application

- 🌐 **Application Web (via Nginx) :** [http://localhost](http://localhost)
- 🔌 **API REST Backend :** [http://localhost/api/](http://localhost/api/)
- 🩺 **Healthcheck Backend :** [http://localhost/health](http://localhost/health)
- 🩺 **Healthcheck Nginx :** [http://localhost/nginx-health](http://localhost/nginx-health)
- 🗄 **MySQL (port externe) :** `localhost:3307`

---

### Option 2 : Démarrage en Environnement Local

Si vous souhaitez exécuter le projet en mode développement natif sans conteneurs :

#### Prérequis

- **Node.js** version 20 ou supérieure
- **MySQL Server** version 8.0 ou 8.4
- Gestionnaire de paquets **npm**

#### 1. Initialiser la base de données MySQL

Créez une base de données nommée `auto_project` et importez le script SQL :

```bash
mysql -u root -p auto_project < auto_project.sql
```

#### 2. Lancer le Backend

```bash
cd backend
npm install
cp .env.example .env
# Renseigner vos identifiants MySQL locaux dans .env (DB_HOST=localhost, etc.)
npm start
```

Le serveur backend écoute par défaut sur [http://localhost:5000](http://localhost:5000).

#### 3. Lancer le Frontend

Ouvrez un second terminal :

```bash
cd frontend
npm install
npm start
```

Le frontend démarre sur [http://localhost:3000](http://localhost:3000).

---

## 🔐 Variables d'Environnement

Le fichier `backend/.env` gère la configuration du serveur backend :

| Variable | Description | Exemple / Défaut |
| :--- | :--- | :--- |
| `PORT` | Port d'écoute du serveur backend | `5000` |
| `DB_HOST` | Hôte du serveur MySQL | `mysql-db` *(Docker)* ou `localhost` |
| `DB_PORT` | Port de la base de données | `3306` |
| `DB_USER` | Utilisateur MySQL | `appuser` |
| `DB_PASSWORD` | Mot de passe MySQL | `Aut0Pr0ject@S3cur3!2024` |
| `DB_NAME` | Nom de la base de données | `auto_project` |
| `JWT_SECRET` | Clé secrète de signature des tokens JWT | Chaîne aléatoire 64 octets hex |
| `ENCRYPTION_KEY` | Clé pour le chiffrement AES des données | Chaîne aléatoire 32 caractères |
| `CORS_ORIGIN` | Origine autorisée pour les requêtes cross-domain | `http://localhost:3000` |
| `LOG_LEVEL` | Niveau de verbosité des logs Winston | `info`, `warn`, `debug`, `error` |
| `NODE_ENV` | Environnement d'exécution | `production` ou `development` |

> ⚠️ **Sécurité :** Ne committez **jamais** vos fichiers `.env` contenant de véritables mots de passe ou clés de production dans un dépôt Git public.

---

## 🛡 Sécurité et Bonnes Pratiques

- **Principe du Moindre Privilège :** Les conteneurs Docker n'utilisent pas le compte `root` en production (`USER 1001` dans l'image Node.js).
- **Protection des En-têtes HTTP :** Le middleware `helmet` et la configuration Nginx protègent contre les attaques XSS, le détournement de clics (*clickjacking*) et le sniffing MIME.
- **Limitation de Débit (Rate Limiting) :** Mise en place d'un limiteur sur les routes sensibles d'authentification pour contrer les attaques par force brute.
- **Audit et Journalisation :** Tous les événements critiques et erreurs sont enregistrés avec rotation de logs via `winston`.
- **Prêt pour le Chiffrement SSL/TLS :** Nginx dispose d'une configuration pré-paramétrée pour basculer facilement en HTTPS (HTTP/2, HSTS, certificats Let's Encrypt / Cert-Manager).

---

## 📄 Licence

Ce projet est distribué sous licence privée ou interne. Tous droits réservés.
