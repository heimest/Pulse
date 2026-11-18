# Pulse — Document de cadrage du projet

**Version :** 1.0  
**Type :** Projet académique — Cloud Computing & DevOps  
**Équipe :** Binôme  
**Statut :** Cadrage initial

---

## 1. Présentation du projet

### 1.1 Contexte

Pulse est une plateforme web de monitoring permettant de surveiller automatiquement la disponibilité et les performances de sites web et d'API HTTP.

Le projet est développé dans le cadre de deux enseignements complémentaires :

- **Cloud Computing :** conception, conteneurisation et déploiement d'une architecture microservices avec Docker et Kubernetes.
- **DevOps :** automatisation des tests, contrôle de la qualité du code, intégration continue et sécurisation du processus de développement.

L'objectif est de disposer d'un projet commun pouvant évoluer progressivement au fil des travaux pratiques des deux enseignements.

### 1.2 Problématique

Comment concevoir et déployer une application de monitoring simple, reposant sur une architecture microservices, tout en garantissant la qualité du code et la reproductibilité des déploiements ?

### 1.3 Objectifs

- Surveiller automatiquement la disponibilité de services HTTP.
- Mesurer et historiser leurs temps de réponse.
- Visualiser leur état depuis une interface web.
- Mettre en œuvre une architecture microservices.
- Conteneuriser et orchestrer les composants avec Docker et Kubernetes.
- Automatiser les tests, les contrôles qualité et la construction des images Docker.
- Appliquer progressivement les bonnes pratiques de sécurité.

## 2. Périmètre fonctionnel

### 2.1 Fonctionnalités du MVP

**Gestion des moniteurs**

- Ajouter une URL à surveiller.
- Consulter la liste des moniteurs.
- Supprimer un moniteur.
- Définir une fréquence de vérification, fixée initialement à 30 secondes.

**Vérification de disponibilité**

- Effectuer des requêtes HTTP périodiques.
- Détecter les erreurs HTTP et les délais d'attente.
- Mesurer le temps de réponse.
- Enregistrer chaque résultat.

**Tableau de bord**

- Afficher les services surveillés.
- Indiquer leur dernier état connu : UP, DOWN ou UNKNOWN.
- Afficher le dernier temps de réponse.
- Consulter l'historique récent des vérifications.

### 2.2 Fonctionnalités exclues du MVP

Pour limiter la complexité, les fonctionnalités suivantes ne seront pas développées dans la première version :

- Authentification et gestion des utilisateurs.
- Notifications par email, SMS ou messagerie.
- Monitoring TCP, DNS ou ICMP.
- Monitoring de ressources système.
- Gestion multi-tenant.
- Analyse avancée et reporting.
- Haute disponibilité applicative complète.

Ces fonctionnalités pourront être envisagées uniquement si les objectifs principaux sont atteints.

## 3. Architecture technique

### 3.1 Vue d'ensemble

L'application repose sur deux microservices backend indépendants, une interface web et une base de données PostgreSQL.

```text
                Utilisateur
                     |
                     v
               Frontend React
                     |
                  HTTP/REST
                     |
                     v
             Kubernetes Ingress
                     |
                     v
              Monitor Service
                     |
               REST interne
                     |
                     v
              Checker Service
                     |
                     v
              Sites et API HTTP

              PostgreSQL
                  ^
                  |
         Monitor / Checker
```

Les deux services utilisent PostgreSQL, avec une séparation logique de leurs données. Le Checker Service communique avec le Monitor Service pour récupérer les moniteurs à vérifier.

Le frontend n'accède pas directement à la base de données.

### 3.2 Monitor Service

**Responsabilité :** gestion des moniteurs et consultation des données.

Fonctionnalités :

- Création et suppression des moniteurs.
- Consultation des moniteurs enregistrés.
- Consultation de leur dernier état.
- Récupération de l'historique des vérifications.
- Exposition d'une API REST.

Exemples d'endpoints :

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/health` | Santé du service |
| GET | `/monitors` | Liste des moniteurs |
| POST | `/monitors` | Création d'un moniteur |
| GET | `/monitors/:id` | Détails d'un moniteur |
| DELETE | `/monitors/:id` | Suppression |
| GET | `/monitors/:id/checks` | Historique |

### 3.3 Checker Service

**Responsabilité :** exécution automatique des vérifications.

Fonctionnalités :

- Récupération des moniteurs actifs.
- Exécution des requêtes HTTP.
- Mesure du temps de réponse.
- Détection des erreurs et timeouts.
- Enregistrement des résultats.
- Exposition d'un endpoint de santé.

Le service fonctionnera initialement avec une seule instance afin d'éviter les vérifications en double.

Une évolution vers plusieurs workers pourra être étudiée ultérieurement.

### 3.4 Communication entre services

**Choix initial : REST avec JSON.**

REST est retenu pour sa simplicité d'implémentation, sa facilité de débogage et sa compatibilité avec les outils standards.

Une migration partielle vers gRPC pourra être réalisée ultérieurement afin d'expérimenter les contrats Protocol Buffers et les communications interservices.

gRPC n'est pas une dépendance obligatoire du MVP.

### 3.5 Base de données

PostgreSQL assurera la persistance des moniteurs et de l'historique des vérifications.

Modèle initial :

**Monitor**

- `id`
- `name`
- `url`
- `interval_seconds`
- `created_at`

**CheckResult**

- `id`
- `monitor_id`
- `status`
- `http_status_code`
- `response_time_ms`
- `checked_at`
- `error_message`

Pour le MVP, une instance PostgreSQL partagée est suffisante, avec des responsabilités d'accès aux données définies par service.

## 4. Stack technologique

| Composant | Technologie |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + TypeScript + Fastify |
| Base de données | PostgreSQL |
| API | REST / JSON |
| Tests | Vitest |
| Qualité | ESLint + Prettier |
| Conteneurisation | Docker |
| Environnement local | Docker Compose |
| Orchestration | Kubernetes / Minikube |
| Exposition HTTP | Kubernetes Ingress |
| CI | GitHub Actions |
| Registry | Docker Hub ou GHCR |
| Sécurité | RBAC, Secrets, NetworkPolicies |

La stack est volontairement homogène en TypeScript afin de réduire le temps de développement.

## 5. Organisation du dépôt

Le projet sera hébergé dans un monorepo Git.

```text
pulse/
├── apps/
│   ├── frontend/
│   ├── monitor-service/
│   └── checker-service/
├── infra/
│   ├── docker/
│   └── kubernetes/
├── scripts/
├── .github/
│   └── workflows/
├── compose.yaml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Chaque application possédera ses propres tests et sa configuration de construction.

Les workflows GitHub Actions permettront de vérifier les services indépendamment.

## 6. Stratégie DevOps

### 6.1 Intégration continue

Chaque microservice backend disposera d'un workflow CI organisé autour de trois jobs :

```text
       Tests ──────┐
                   ├──> Image Docker
       Qualité ────┘
```

La construction de l'image Docker ne sera autorisée que si les tests et les contrôles qualité réussissent.

Sur les pull requests, les images seront construites sans être publiées. La publication sera réservée aux événements autorisés sur la branche principale.

### 6.2 Contrôles automatisés

Les workflows devront comprendre :

- Exécution des tests unitaires.
- Vérification du linting.
- Vérification du formatage.
- Construction des images Docker.
- Détection de secrets avec Gitleaks.
- Conservation des rapports en cas de succès ou d'échec.
- Timeouts et permissions GitHub minimales.
- Cache des dépendances.
- Annulation des exécutions devenues obsolètes.

### 6.3 Reproductibilité locale

Une commande unique permettra de reproduire les portes qualité avant une pull request.

```bash
pnpm verify
```

Cette commande exécutera les tests, le linting et la vérification du formatage, et échouera dès qu'un contrôle n'est pas satisfait.

Elle ne remplacera pas les contrôles spécifiques aux workflows distants, notamment Gitleaks et la publication des images.

### 6.4 Stratégie Git

- `main` : branche principale protégée.
- `feature/*` : développement des fonctionnalités.
- `tp/*` : branches dédiées aux travaux pratiques lorsque nécessaire.
- Pull requests obligatoires avant intégration.
- Contrôles CI requis pour fusionner.

Les conventions exactes de branches et checkpoints pourront être adaptées aux consignes de chaque enseignant.

## 7. Déploiement Cloud et Kubernetes

### Étape 1 — Premier microservice

**Objectif : obtenir un premier service opérationnel sur Kubernetes.**

Livrables :

- Monitor Service minimal.
- Endpoint `/health`.
- Dockerfile.
- Image publiée dans une registry.
- Deployment Kubernetes.
- Service Kubernetes.
- Vérification de son accessibilité.

Cette étape constitue le premier jalon du projet Cloud et le périmètre minimal à préparer pour le premier TP DevOps, conformément à l'indication de l'enseignant.

Le service pourra initialement fonctionner sans base de données, avec des données statiques ou en mémoire.

### Étape 2 — Gateway

Ajouter un Ingress Kubernetes pour exposer le service via un point d'entrée HTTP.

### Étape 3 — Deuxième microservice

Développer et déployer le Checker Service.

Mettre en place les échanges REST entre les deux services.

### Étape 4 — Persistance

Ajouter PostgreSQL, configurer la connexion et persister les moniteurs ainsi que les résultats des vérifications.

### Étape 5 — Sécurité

Mettre en œuvre :

- Des ServiceAccounts dédiés.
- Des permissions RBAC minimales.
- Des Secrets Kubernetes pour les identifiants.
- Des NetworkPolicies si le réseau du cluster les prend en charge.
- Des contrôles de sécurité sur les images.

### Étape 6 — Extensions optionnelles

Selon le temps disponible :

- Déploiement dans un cloud.
- Communication gRPC.
- Service mesh et mTLS.
- Probes Kubernetes et limites de ressources.
- Observabilité du cluster.

## 8. Articulation avec le TP 01 DevOps

### 8.1 Objectif du premier TP

Le TP 01 vise à construire une intégration continue **observable et bloquante**.

L'objectif n'est pas d'avoir terminé Pulse, mais de disposer d'un code initial testable et d'une CI capable de détecter, expliquer et bloquer les changements défectueux.

### 8.2 État initial requis

Pour commencer le TP sur Pulse, le dépôt devra contenir au minimum :

- Un Monitor Service exécutable.
- Un endpoint `/health`.
- Quelques tests unitaires.
- Une configuration de linting et de formatage.
- Un Dockerfile fonctionnel.
- Un dépôt GitHub avec GitHub Actions.

Il n'est pas nécessaire de disposer du frontend, du Checker Service ou de PostgreSQL à ce stade.

### 8.3 Adaptation du TP

L'énoncé DevOps original repose sur deux applications, Java et Python, et impose Checkstyle et Ruff.

Pulse utilise initialement TypeScript. Les équivalents proposés sont :

| TP original | Adaptation Pulse |
|---|---|
| Tests Java / Gradle | Tests Vitest |
| Tests Python / Pytest | Tests Vitest |
| Checkstyle | ESLint |
| Ruff | ESLint + Prettier |
| `course.py verify` | `pnpm verify` |
| Deux workflows applicatifs | Un workflow initial, puis deux |
| Rapports JUnit/Pytest | Rapports Vitest au format JUnit |
| Gitleaks | Gitleaks |

**Point à valider avec l'enseignant :** cette adaptation ne respecte pas littéralement les exigences Java, Python, Checkstyle et Ruff du TP. Elle suppose que le professeur autorise l'utilisation du projet personnel et de ses outils équivalents.

Si les deux workflows applicatifs sont obligatoires dès le premier TP, il faudra prévoir deux applications minimales ou obtenir une adaptation explicite des critères.

### 8.4 Expériences à réaliser

La CI devra permettre de :

1. Introduire volontairement un test défaillant.
2. Observer le job en échec sur une pull request.
3. Consulter le rapport généré.
4. Mesurer le délai de retour.
5. Corriger le test dans un commit distinct.
6. Vérifier que les contrôles passent.
7. Empêcher l'intégration d'une PR défaillante.

Une détection de secrets sera également ajoutée selon les consignes de l'enseignant, sans utiliser de véritables identifiants.

## 9. Répartition indicative du travail

| Membre A | Membre B |
|---|---|
| Monitor Service | Checker Service |
| API REST | Logique de vérification HTTP |
| Modèle des moniteurs | Historique des résultats |
| Tests du Monitor Service | Tests du Checker Service |
| Dockerfile du Monitor Service | Dockerfile du Checker Service |

**Travail commun :** architecture, Kubernetes, GitHub Actions, sécurité, intégration et démonstration.

Pour le premier jalon, les deux membres pourront travailler ensemble sur le Monitor Service et sa CI.

## 10. Critères de réussite

### MVP fonctionnel

- Un moniteur peut être créé.
- Une URL est vérifiée automatiquement.
- Le résultat d'une vérification est conservé.
- L'état du service apparaît dans le dashboard.
- Les deux microservices communiquent correctement.

### Infrastructure

- Chaque service possède une image Docker.
- Les services sont déployés sur Kubernetes.
- Les communications interservices fonctionnent.
- L'Ingress expose l'application.
- Les données persistent après redémarrage du service applicatif.

### DevOps

- Les tests sont exécutés automatiquement.
- Les contrôles qualité bloquent les changements défectueux.
- Les images ne sont construites qu'après validation.
- Les rapports sont accessibles même en cas d'échec.
- Les secrets sont contrôlés.
- La commande locale de vérification est fonctionnelle.
- La branche principale est protégée.

## 11. Risques et limitations

**Complexité excessive :** limiter le développement aux fonctionnalités MVP avant toute extension.

**Vérifications HTTP en double :** maintenir une seule instance du Checker Service dans un premier temps.

**Cibles non fiables :** valider les URLs, limiter les délais d'attente et interdire les destinations internes sensibles avant toute exposition publique.

**Dépendance à PostgreSQL :** prévoir une configuration simple en local et des mécanismes de persistance adaptés à Kubernetes.

**Incompatibilité avec le TP DevOps :** confirmer l'autorisation de remplacer les outils Java/Python par leurs équivalents TypeScript.

**Temps limité :** privilégier la CI, les microservices et Kubernetes avant les fonctionnalités visuelles avancées.

## 12. Plan de réalisation

| Phase | Livrable principal |
|---|---|
| 1. Initialisation | Monorepo, Monitor Service minimal, Dockerfile |
| 2. CI initiale | Tests, qualité, rapports, Gitleaks, PR |
| 3. Kubernetes | Deployment, Service, Ingress |
| 4. Fonctionnel | Checker Service et communication REST |
| 5. Persistance | PostgreSQL et historique |
| 6. Interface | Dashboard React minimal |
| 7. Sécurité | RBAC, Secrets et contrôles |
| 8. Finalisation | Documentation, démonstration et éventuels bonus |

---

## Conclusion

Pulse constitue un support commun pour les enseignements Cloud Computing et DevOps.

Son périmètre fonctionnel volontairement réduit permet de concentrer les efforts sur les objectifs pédagogiques : architecture microservices, conteneurisation, orchestration Kubernetes, intégration continue et sécurité.

Le projet sera développé de manière incrémentale, en commençant par un seul service fonctionnel, puis en enrichissant progressivement l'architecture sans compromettre sa simplicité.
