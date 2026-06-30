# SportNest - Deployment & Infrastructure Architecture Specification

**Document Reference:** SN-DEP-V1.0  
**Version:** 1.0.0-Release  
**Author:** Lead Software Architect  
**Infrastructure Strategy:** Hybrid Serverless Frontend + Managed API Container Cluster  

---

## 1. Environment Topology

SportNest implements a three-tier lifecycle topology to ensure code verification before reaching production.

```
┌──────────────────┐           ┌──────────────────┐           ┌──────────────────┐
│   Development    │           │     Staging      │           │    Production    │
├──────────────────┤           ├──────────────────┤           ├──────────────────┤
│ Local Workstations│           │ Vercel Preview   │           │ Vercel Production│
│ SQLite/Postgres  │ ──Merge──▶│ Render Container │ ──Merge──▶│ AWS ECS (Fargate)│
│ Docker Desktop   │           │ RDS Postgres     │           │ RDS Multi-AZ DB  │
└──────────────────┘           └──────────────────┘           └──────────────────┘
```

### 1.1 Development Environment
*   **Workstations:** Local code execution utilizing Node.js v20+, package manager `pnpm`, and monorepo orchestrator `turbo`.
*   **Local Databases:** PostgreSQL running via local Docker containers, keeping local schemas matched with production.
*   **Dev Mode:** `pnpm dev` launches web (port 3000), admin (port 3001), and api (port 4000).

### 1.2 Staging Environment
*   **Code Trigger:** Automatic deploy triggered on commits to the `develop` branch.
*   **Web & Admin:** Hosted as Serverless apps on Vercel preview environments.
*   **API Service:** Hosted on a single container cluster instance (e.g. AWS App Runner or Render Web Service).
*   **Database:** Single-node managed AWS RDS PostgreSQL instance.

### 1.3 Production Environment
*   **Code Trigger:** Manual release approval triggered on tags or merges to the `main` branch.
*   **Web & Admin:** Hosted on Vercel Enterprise Serverless platform.
*   **API Service:** Containerized inside Docker and deployed to AWS ECS running Fargate (serverless container orchestration) across multiple Availability Zones (Multi-AZ).
*   **Database:** Multi-AZ Amazon RDS for PostgreSQL with automated failover replication.

---

## 2. Platform Component Hosting

### 2.1 Frontends (Web & Admin)
*   **Platform:** Vercel.
*   **Capabilities Utilized:**
    *   **Edge Middleware:** Geolocation lookup for sports categories and security checks.
    *   **Edge Functions:** Dynamic SSR page compilation.
    *   **Incremental Static Regeneration (ISR):** Renders store catalog details every 60 seconds to maintain high performance.

### 2.2 Backend API Service
*   **Platform:** Dockerized Node.js cluster deployed on AWS ECS.
*   **Scaling Thresholds:** Auto-scales based on CPU/Memory usage. Minimum 2 tasks, scaling up to 10 tasks under high tournament sign-up loads.
*   **Proxy/Ingress:** AWS Application Load Balancer (ALB) performing TLS termination and routing path rules (`/v1/*` directed to API cluster).

### 2.3 Relational Database (PostgreSQL)
*   **Platform:** Amazon RDS for PostgreSQL (Engine v16).
*   **High Availability:** Multi-AZ configuration. Production transactions are committed synchronously to the primary master, with asynchronous replication to a read-replica in a separate Availability Zone.
*   **Capacity:** General Purpose SSD (gp3), configured with automatic storage scaling to accommodate growing transaction history.

---

## 3. Domain & CDN Architecture

### 3.1 Domain Layout

```
                               ┌──────────────────────┐
                               │  DNS (Cloudflare)    │
                               └──────────────────────┘
                                          │
                 ┌────────────────────────┼────────────────────────┐
                 ▼                        ▼                        ▼
       ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
       │   sportnest.com  │     │admin.sportnest.com│    │ api.sportnest.com│
       │  (Web Portal)    │     │ (Admin Console)  │     │  (Express API)   │
       └──────────────────┘     └──────────────────┘     └──────────────────┘
```

### 3.2 DNS & SSL/TLS
*   **Nameserver Management:** Cloudflare DNS handles root and subdomain proxy configurations.
*   **SSL Configuration:** Enforces SSL "Full (Strict)" mode. Origin servers must present valid certificates signed by trusted authorities (Let's Encrypt / AWS ACM).
*   **Proxy Capabilities:** Cloudflare proxies HTTP traffic, filtering out malicious bots and mitigating DDoS attacks.

### 3.3 Content Delivery Network (CDN) & Static Assets
*   **Asset Cache:** Vercel Edge Network caches static assets, images, and HTML fragments worldwide.
*   **Image Storage:** Physical files (product images, event graphics) are stored in an Amazon S3 Bucket. S3 bucket policies restrict public access; image requests are instead routed through a CDN (Cloudflare or CloudFront) using signed URLs.

---

## 4. CI/CD Pipeline Configuration

SportNest utilizes GitHub Actions to automate linting, compilation, testing, and deployments.

```
[Developer: Push Code] ──▶ [GitHub Actions Runner]
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      ▼                                                       ▼
[Phase 1: Lint & Verify]                                [Phase 2: Build & Test]
- Run ESLint v9                                         - Compile TypeScript
- Run Prettier Checks                                   - Execute Vitest Suite
      │                                                       │
      └───────────────────────────┬───────────────────────────┘
                                  ▼
                        [Phase 3: Deploy]
                        - Build Production Docker Image
                        - Push to ECR & Deploy to ECS
```

### 4.1 Pipeline Integration Stages
1.  **Code Check:** Triggered on any pull request. Runs `pnpm install`, `pnpm lint`, and verifies codebase formatting.
2.  **Test Run:** Compiles TypeScript and runs `pnpm test`. Any test failure immediately aborts the deployment process.
3.  **Docker Compiling (API):** If target is `main`, creates a production Docker image using a multi-stage `Dockerfile`. Pushes the image to Amazon Elastic Container Registry (ECR).
4.  **Deployment Handover:** Instructs Amazon ECS to execute a rolling update with the new container image, ensuring zero-downtime deployments.

---

## 5. Monitoring, Logging, & Alerting

### 5.1 Application Performance Monitoring (APM)
*   **Tools:** Datadog or Sentry.
*   **Metrics Tracked:** API latencies, server error rates (HTTP 5xx), database transaction times, and memory leaks.

### 5.2 Centralized Logging
*   **Tools:** Winston/Pino logging streamed to AWS CloudWatch or Axiom.
*   **Log Rules:** Log outputs must use structured JSON format. Confidential data (card numbers, user passwords, user addresses) must be automatically redacted.

### 5.3 Alerting Rules
*   **P1 Severity Alert:** Triggered by CloudWatch if API error rate exceeds 2% over a 5-minute window, or if server memory utilization crosses 90%. Logs alerts immediately to the team's Slack/PagerDuty channel.

---

## 6. Backup & Recovery Operations

*   **Database Snapshot:** Automated daily full backups with a 30-day retention window.
*   **Point-in-Time-Recovery (PITR):** Transaction logs archived every 5 minutes, allowing database restoration to any second within the retention period.
*   **Recovery Objective (RPO):** Maximum 5 minutes of potential data loss.
*   **Recovery Time (RTO):** System restored and operational within 15 minutes of an outage.
